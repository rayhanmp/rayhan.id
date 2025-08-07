import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";

const OddsVsLogitComparison: React.FC = () => {
  const [probability, setProbability] = useState<number>(0.5);
  const [useLogScale, setUseLogScale] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const leftSvgRef = useRef<SVGSVGElement | null>(null);
  const rightSvgRef = useRef<SVGSVGElement | null>(null);

  // Calculate odds and logit
  const calculateOdds = (p: number): number => {
    if (p >= 1) return Infinity;
    if (p <= 0) return 0;
    return p / (1 - p);
  };

  const calculateLogit = (p: number): number => {
    if (p >= 1) return Infinity;
    if (p <= 0) return -Infinity;
    return Math.log(p / (1 - p));
  };

  const currentOdds = calculateOdds(probability);
  const currentLogit = calculateLogit(probability);

  // Visualization update function
  const updateVisualization = (currentLogScale: boolean) => {
    if (!leftSvgRef.current || !rightSvgRef.current) return;

    const width = 400;
    const height = 350;
    const margin = { top: 40, right: 40, bottom: 60, left: 70 };

    // Clear both SVGs
    const leftSvg = d3.select(leftSvgRef.current);
    const rightSvg = d3.select(rightSvgRef.current);
    leftSvg.selectAll("*").remove();
    rightSvg.selectAll("*").remove();

    // Set viewBox for both
    leftSvg.attr("viewBox", `0 0 ${width} ${height}`);
    rightSvg.attr("viewBox", `0 0 ${width} ${height}`);

    // Generate data for curves - force extension well beyond boundaries
    const curveData: [number, number, number][] = [];
    
    // Generate comprehensive data with ultra-fine resolution
    for (let p = 0.00001; p <= 0.99999; p += 0.00005) {
      const odds = calculateOdds(p);
      const logit = calculateLogit(p);
      curveData.push([p, odds, logit]);
    }
    
    // Add many extreme points to guarantee curve extends beyond plot
    const manyExtremePoints = [
      0.000001,   // Very close to 0
      0.91,       // odds = 10.11 (just above y=10)
      0.92,       // odds ≈ 11.5 
      0.93,       // odds ≈ 13.3
      0.94,       // odds ≈ 15.7
      0.95,       // odds = 19
      0.96,       // odds = 24
      0.97,       // odds ≈ 32
      0.98,       // odds = 49
      0.99,       // odds = 99
      0.995,      // odds = 199
      0.999,      // odds = 999
      0.9999,     // odds = 9999
      0.99999,    // odds = 99999
      0.999999    // Very close to 1
    ];
    
    for (const p of manyExtremePoints) {
      const odds = calculateOdds(p);
      const logit = calculateLogit(p);
      curveData.push([p, odds, logit]);
    }
    
    // Sort by probability to maintain proper curve order
    curveData.sort((a, b) => a[0] - b[0]);

    // Filter data to avoid numerical instability with huge numbers
    const leftCurveData = currentLogScale 
      ? curveData.filter(d => d[1] > 0 && d[1] <= 100) // For log scale, exclude 0 and extend range
      : curveData.filter(d => d[1] <= 15);
    const rightCurveData = curveData.filter(d => d[2] >= -10 && d[2] <= 10);

    // === LEFT GRAPH: ODDS ===
    const leftXScale = d3.scaleLinear()
      .domain([0, 1])
      .range([margin.left, width - margin.right]);
    
    const leftYScale = currentLogScale 
      ? d3.scaleLog()
          .domain([0.1, 100]) // Log scale from 0.1 to 100
          .range([height - margin.bottom, margin.top])
      : d3.scaleLinear()
          .domain([0, 10]) // Linear scale from 0 to 10
          .range([height - margin.bottom, margin.top]);

    // Left grid lines
    const leftXGridLines = d3.axisBottom(leftXScale)
      .tickSize(-(height - margin.top - margin.bottom))
      .tickFormat(() => "")
      .ticks(5);

    const leftYGridLines = d3.axisLeft(leftYScale)
      .tickSize(-(width - margin.left - margin.right))
      .tickFormat(() => "")
      .ticks(5);

    leftSvg.append("g")
      .attr("class", "x-grid")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(leftXGridLines)
      .selectAll("line")
      .style("stroke", "#e5e7eb")
      .style("stroke-width", "1px")
      .style("opacity", 0.8);

    leftSvg.append("g")
      .attr("class", "y-grid")
      .attr("transform", `translate(${margin.left},0)`)
      .call(leftYGridLines)
      .selectAll("line")
      .style("stroke", "#e5e7eb")
      .style("stroke-width", "1px")
      .style("opacity", 0.8);

    // Left curve (odds) - use linear interpolation to ensure curve reaches boundaries
    const leftLine = d3.line<[number, number, number]>()
      .x(d => leftXScale(d[0]))
      .y(d => leftYScale(d[1])) // Draw the actual curve
      .curve(d3.curveLinear);

    // Create clipping path for left graph
    leftSvg.append("defs")
      .append("clipPath")
      .attr("id", "left-clip")
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom);

    leftSvg.append("path")
      .datum(leftCurveData)
      .attr("d", leftLine)
      .attr("fill", "none")
      .attr("stroke", "#2563eb")
      .attr("stroke-width", 3)
      .attr("clip-path", "url(#left-clip)") // Use clipping
      .style("filter", "drop-shadow(0px 0px 4px rgba(37, 99, 235, 0.3))");

    // Left current point
    const leftCurrentPoint = leftSvg.append("g").attr("class", "current-point");
    
    // Calculate Y position based on scale type
    const clampedOdds = currentLogScale 
      ? Math.max(0.1, Math.min(100, currentOdds)) // For log scale, clamp between 0.1 and 100
      : Math.min(currentOdds, 10); // For linear scale, clamp at 10

    leftCurrentPoint.append("circle")
      .attr("cx", leftXScale(probability))
      .attr("cy", leftYScale(clampedOdds))
      .attr("r", 8)
      .attr("fill", "#ef4444")
      .attr("opacity", 0.3);

    leftCurrentPoint.append("circle")
      .attr("cx", leftXScale(probability))
      .attr("cy", leftYScale(clampedOdds))
      .attr("r", 5)
      .attr("fill", "#ef4444")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("filter", "drop-shadow(0px 2px 4px rgba(239, 68, 68, 0.5))");

    // Left dashed lines - only if the point is within visible range
    const leftPointY = leftYScale(clampedOdds);
    const leftPointX = leftXScale(probability);
    
    const shouldShowLeftDashedLines = currentLogScale 
      ? (currentOdds >= 0.1 && currentOdds <= 100)
      : (currentOdds <= 10);
    
    if (shouldShowLeftDashedLines) {
      leftSvg.append("line")
        .attr("x1", leftPointX)
        .attr("y1", leftPointY)
        .attr("x2", leftPointX)
        .attr("y2", height - margin.bottom)
        .attr("stroke", "#ef4444")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,2")
        .attr("opacity", 0.7);

      leftSvg.append("line")
        .attr("x1", margin.left)
        .attr("y1", leftPointY)
        .attr("x2", leftPointX)
        .attr("y2", leftPointY)
        .attr("stroke", "#ef4444")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,2")
        .attr("opacity", 0.7);
    }

    // Left axes
    const leftXAxis = d3.axisBottom(leftXScale).ticks(5);
    const leftYAxis = d3.axisLeft(leftYScale).ticks(5);

    leftSvg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(leftXAxis)
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#374151");

    leftSvg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(leftYAxis)
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#374151");

    // Left axis styling
    leftSvg.selectAll(".domain")
      .style("stroke", "#6b7280")
      .style("stroke-width", "1.5px");

    leftSvg.selectAll(".tick line")
      .style("stroke", "#6b7280")
      .style("stroke-width", "1px");

    // Left labels
    leftSvg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 15)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style("fill", "#374151")
      .text("Probability (P)");

    leftSvg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style("fill", "#374151")
      .text(currentLogScale ? "Log₁₀(Odds) (P/(1-P))" : "Odds (P/(1-P))");

    // Left title
    leftSvg.append("text")
      .attr("x", width / 2)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "700")
      .style("fill", "#1f2937")
      .text("Odds Function");

    // === RIGHT GRAPH: LOGIT ===
    const rightXScale = d3.scaleLinear()
      .domain([0, 1])
      .range([margin.left, width - margin.right]);
    
    const rightYScale = d3.scaleLinear()
      .domain([-4.6, 4.6]) // Reasonable range for logit
      .range([height - margin.bottom, margin.top]);

    // Right grid lines
    const rightXGridLines = d3.axisBottom(rightXScale)
      .tickSize(-(height - margin.top - margin.bottom))
      .tickFormat(() => "")
      .ticks(5);

    const rightYGridLines = d3.axisLeft(rightYScale)
      .tickSize(-(width - margin.left - margin.right))
      .tickFormat(() => "")
      .ticks(5);

    rightSvg.append("g")
      .attr("class", "x-grid")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(rightXGridLines)
      .selectAll("line")
      .style("stroke", "#e5e7eb")
      .style("stroke-width", "1px")
      .style("opacity", 0.8);

    rightSvg.append("g")
      .attr("class", "y-grid")
      .attr("transform", `translate(${margin.left},0)`)
      .call(rightYGridLines)
      .selectAll("line")
      .style("stroke", "#e5e7eb")
      .style("stroke-width", "1px")
      .style("opacity", 0.8);

    // Right curve (logit) - use linear interpolation to ensure curve reaches boundaries  
    const rightLine = d3.line<[number, number, number]>()
      .x(d => rightXScale(d[0]))
      .y(d => rightYScale(d[2])) // Draw the actual curve
      .curve(d3.curveLinear);

    // Create clipping path for right graph
    rightSvg.append("defs")
      .append("clipPath")
      .attr("id", "right-clip")
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom);

    rightSvg.append("path")
      .datum(rightCurveData)
      .attr("d", rightLine)
      .attr("fill", "none")
      .attr("stroke", "#059669")
      .attr("stroke-width", 3)
      .attr("clip-path", "url(#right-clip)") // Use clipping
      .style("filter", "drop-shadow(0px 0px 4px rgba(5, 150, 105, 0.3))");

    // Right current point
    const rightCurrentPoint = rightSvg.append("g").attr("class", "current-point");
    
    rightCurrentPoint.append("circle")
      .attr("cx", rightXScale(probability))
      .attr("cy", rightYScale(Math.max(-5, Math.min(5, currentLogit))))
      .attr("r", 8)
      .attr("fill", "#ef4444")
      .attr("opacity", 0.3);

    rightCurrentPoint.append("circle")
      .attr("cx", rightXScale(probability))
      .attr("cy", rightYScale(Math.max(-5, Math.min(5, currentLogit))))
      .attr("r", 5)
      .attr("fill", "#ef4444")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("filter", "drop-shadow(0px 2px 4px rgba(239, 68, 68, 0.5))");

    // Right dashed lines - only if the point is within visible range
    const rightPointY = rightYScale(Math.max(-5, Math.min(5, currentLogit)));
    const rightPointX = rightXScale(probability);
    
    if (currentLogit >= -5 && currentLogit <= 5) {
      rightSvg.append("line")
        .attr("x1", rightPointX)
        .attr("y1", rightPointY)
        .attr("x2", rightPointX)
        .attr("y2", height - margin.bottom)
        .attr("stroke", "#ef4444")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,2")
        .attr("opacity", 0.7);

      rightSvg.append("line")
        .attr("x1", margin.left)
        .attr("y1", rightPointY)
        .attr("x2", rightPointX)
        .attr("y2", rightPointY)
        .attr("stroke", "#ef4444")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,2")
        .attr("opacity", 0.7);
    }

    // Right axes
    const rightXAxis = d3.axisBottom(rightXScale).ticks(5);
    const rightYAxis = d3.axisLeft(rightYScale).ticks(5);

    rightSvg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(rightXAxis)
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#374151");

    rightSvg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(rightYAxis)
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#374151");

    // Right axis styling
    rightSvg.selectAll(".domain")
      .style("stroke", "#6b7280")
      .style("stroke-width", "1.5px");

    rightSvg.selectAll(".tick line")
      .style("stroke", "#6b7280")
      .style("stroke-width", "1px");

    // Right labels
    rightSvg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 15)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style("fill", "#374151")
      .text("Probability (P)");

    rightSvg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style("fill", "#374151")
      .text("Logit (log(P/(1-P)))");

    // Right title
    rightSvg.append("text")
      .attr("x", width / 2)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "700")
      .style("fill", "#1f2937")
      .text("Logit Function");

    // Interactive clicking for both graphs
    const addClickHandler = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, xScale: d3.ScaleLinear<number, number>) => {
      svg.append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom)
        .attr("fill", "transparent")
        .attr("pointer-events", "all")
        .style("cursor", "crosshair")
        .on("click", function(event) {
          const [mouseX] = d3.pointer(event);
          const newP = xScale.invert(mouseX);
          const clampedP = Math.max(0.01, Math.min(0.99, newP));
          setProbability(Number(clampedP.toFixed(3)));
        });
    };

    addClickHandler(leftSvg, leftXScale);
    addClickHandler(rightSvg, rightXScale);
  };

  // Handle scale changes with animation
  const handleScaleChange = (newLogScale: boolean) => {
    if (newLogScale !== useLogScale && !isAnimating) {
      setIsAnimating(true);
      
      // Simple fade out, change, fade in
      setTimeout(() => {
        setUseLogScale(newLogScale);
        setTimeout(() => {
          setIsAnimating(false);
        }, 600);
      }, 300);
    }
  };

  // Update visualization when parameters change
  useEffect(() => {
    if (!isAnimating) {
      updateVisualization(useLogScale);
    }
  }, [probability, currentOdds, currentLogit, useLogScale, isAnimating]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "30px",
      backgroundColor: "#fff",
      borderRadius: "12px",
      margin: "30px 0"
    }}>
      {/* Controls */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "20px",
        marginBottom: "25px",
        flexWrap: "wrap",
        justifyContent: "center"
      }}>
        <label style={{
          fontSize: "16px",
          fontWeight: "600",
          color: "#374151"
        }}>
          Probability (P) =
        </label>
        <input
          type="number"
          value={probability}
          onChange={(e) => setProbability(Math.max(0.01, Math.min(0.99, parseFloat(e.target.value) || 0.5)))}
          step="0.01"
          min="0.01"
          max="0.99"
          style={{
            padding: "8px 12px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "2px solid #d1d5db",
            width: "120px",
            textAlign: "center",
            outline: "none",
            transition: "all 0.2s ease"
          }}
        />
        <input
          type="range"
          min="0.01"
          max="0.99"
          step="0.01"
          value={probability}
          onChange={(e) => setProbability(parseFloat(e.target.value))}
          style={{
            width: "300px",
            height: "6px",
            borderRadius: "3px",
            background: "linear-gradient(to right, #ef4444, #f59e0b, #10b981)",
            outline: "none",
            cursor: "pointer"
          }}
        />
      </div>

      {/* Graphs Container */}
      <div style={{
        display: "flex",
        gap: "20px",
        justifyContent: "center",
        marginBottom: "25px",
        flexWrap: "nowrap"
      }}>
        {/* Left Graph - Odds */}
        <div>
          <svg 
            ref={leftSvgRef}
            width={400}
            height={350}
                          style={{ 
                backgroundColor: "#fff",
                borderRadius: "8px",
                opacity: isAnimating ? 0.3 : 1,
                transition: "opacity 0.6s ease-in-out, transform 0.6s ease-in-out",
                transform: isAnimating ? "scale(0.98)" : "scale(1)",
                transformOrigin: "center"
              }}
          />
        </div>

        {/* Right Graph - Logit */}
        <div>
          <svg 
            ref={rightSvgRef}
            width={400}
            height={350}
            style={{ 
              backgroundColor: "#fff",
              borderRadius: "8px"
            }}
          />
        </div>
      </div>

      {/* Results Display */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        width: "100%",
        maxWidth: "800px"
      }}>
        {/* Current Values */}
        <div style={{
          backgroundColor: "#eff6ff",
          padding: "20px",
          borderRadius: "10px",
          border: "2px solid #2563eb",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "14px", color: "#1d4ed8", fontWeight: "600", marginBottom: "8px" }}>
            Odds
          </div>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "#1e3a8a" }}>
            {currentOdds > 100 ? "∞" : currentOdds.toFixed(3)}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            P/(1-P)
          </div>
        </div>

        <div style={{
          backgroundColor: "#ecfdf5",
          padding: "20px",
          borderRadius: "10px",
          border: "2px solid #059669",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "14px", color: "#047857", fontWeight: "600", marginBottom: "8px" }}>
            Logit (Log-Odds)
          </div>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "#064e3b" }}>
            {Math.abs(currentLogit) > 100 ? (currentLogit > 0 ? "∞" : "-∞") : currentLogit.toFixed(3)}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            log(P/(1-P))
          </div>
        </div>
      </div>

      {/* Minimal Hint Box */}
      <div style={{
        marginTop: "20px",
        padding: "10px 16px",
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        fontSize: "13px",
        color: "#64748b",
        flexWrap: "nowrap"
      }}>
        <span>💡 Try</span>
        <label style={{ 
          color: "#3b82f6", 
          textDecoration: "underline", 
          cursor: "pointer", 
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          lineHeight: "1",
          marginTop: "6px"
        }}>
          <input 
            type="checkbox" 
            checked={useLogScale} 
            onChange={(e) => handleScaleChange(e.target.checked)} 
            style={{ 
              cursor: "pointer",
              margin: "0",
              padding: "0",
              width: "13px",
              height: "13px",
              verticalAlign: "baseline",
              position: "relative",
              top: "0px"
            }} 
          />
          <span style={{ lineHeight: "1" }}>log scale</span>
        </label>
        <span>on the odds plot to see the exponential relationship</span>
      </div>
    </div>
  );
};

export default OddsVsLogitComparison; 