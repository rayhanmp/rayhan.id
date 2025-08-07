import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";

interface DataPoint {
  score: number;
  label: 0 | 1;
}

interface Metrics {
  threshold: number;
  tpr: number; // True Positive Rate (Recall)
  fpr: number; // False Positive Rate
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

const InteractiveROCCurve: React.FC = () => {
  const [threshold, setThreshold] = useState<number>(0.5);
  const [data, setData] = useState<DataPoint[]>(() => generateSampleData());
  const [metrics, setMetrics] = useState<Metrics>({
    threshold: 0.5,
    tpr: 0,
    fpr: 0,
    precision: 0,
    recall: 0,
    f1: 0,
    accuracy: 0,
    tp: 0,
    fp: 0,
    tn: 0,
    fn: 0
  });
  
  const rocSvgRef = useRef<SVGSVGElement | null>(null);
  const dataSvgRef = useRef<SVGSVGElement | null>(null);

  // Function to regenerate data
  const regenerateData = () => {
    setData(generateSampleData());
  };

  // Generate realistic noisy sample data for binary classification
  function generateSampleData(): DataPoint[] {
    const data: DataPoint[] = [];
    
    // Generate positive class samples (label = 1) - more overlapping distribution
    for (let i = 0; i < 200; i++) {
      // Use normal distribution approximation (Box-Muller transform)
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      // Mean around 0.65, but with significant overlap
      let score = 0.65 + z0 * 0.22;
      
      // Add some outliers to make it more realistic
      if (Math.random() < 0.1) {
        score = Math.random() * 0.4; // Some positive samples with very low scores
      }
      
      score = Math.max(0.01, Math.min(0.99, score));
      data.push({ score, label: 1 });
    }
    
    // Generate negative class samples (label = 0) - overlapping distribution
    for (let i = 0; i < 200; i++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      
      // Mean around 0.35, with significant overlap with positive class
      let score = 0.35 + z0 * 0.22;
      
      // Add some outliers
      if (Math.random() < 0.1) {
        score = 0.6 + Math.random() * 0.4; // Some negative samples with high scores
      }
      
      score = Math.max(0.01, Math.min(0.99, score));
      data.push({ score, label: 0 });
    }
    
    // Add some really tricky edge cases to make it more realistic
    for (let i = 0; i < 20; i++) {
      // Hard negatives - negative samples that look positive
      data.push({
        score: 0.7 + Math.random() * 0.25,
        label: 0
      });
      
      // Hard positives - positive samples that look negative  
      data.push({
        score: 0.05 + Math.random() * 0.25,
        label: 1
      });
    }
    
    return data.sort((a, b) => b.score - a.score);
  }

  // Calculate metrics at a given threshold
  const calculateMetrics = (threshold: number): Metrics => {
    let tp = 0, fp = 0, tn = 0, fn = 0;
    
    data.forEach(point => {
      const predicted = point.score >= threshold ? 1 : 0;
      
      if (point.label === 1 && predicted === 1) tp++;
      else if (point.label === 0 && predicted === 1) fp++;
      else if (point.label === 0 && predicted === 0) tn++;
      else if (point.label === 1 && predicted === 0) fn++;
    });
    
    const tpr = tp + fn > 0 ? tp / (tp + fn) : 0; // Recall/Sensitivity
    const fpr = fp + tn > 0 ? fp / (fp + tn) : 0; // 1 - Specificity
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tpr;
    const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
    const accuracy = (tp + tn) / (tp + fp + tn + fn);
    
    return {
      threshold,
      tpr,
      fpr,
      precision,
      recall,
      f1,
      accuracy,
      tp,
      fp,
      tn,
      fn
    };
  };

  // Generate ROC curve data
  const generateROCData = (): Array<{fpr: number, tpr: number, threshold: number}> => {
    const rocData: Array<{fpr: number, tpr: number, threshold: number}> = [];
    
    // Get all unique scores as potential thresholds
    const uniqueScores = [...new Set(data.map(d => d.score))].sort((a, b) => b - a);
    
    // Add extreme points
    uniqueScores.unshift(1.1); // Start with threshold > max score
    uniqueScores.push(-0.1);   // End with threshold < min score
    
    uniqueScores.forEach(t => {
      const m = calculateMetrics(t);
      rocData.push({ fpr: m.fpr, tpr: m.tpr, threshold: t });
    });
    
    return rocData;
  };

  // Update metrics when threshold changes
  useEffect(() => {
    setMetrics(calculateMetrics(threshold));
  }, [threshold, data]);

  // ROC Curve visualization
  useEffect(() => {
    if (!rocSvgRef.current) return;

    const svg = d3.select(rocSvgRef.current);
    svg.selectAll("*").remove();

    const width = 320;
    const height = 320;
    const margin = { top: 35, right: 45, bottom: 50, left: 45 };

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const xScale = d3.scaleLinear().domain([0, 1]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([0, 1]).range([height - margin.bottom, margin.top]);

    // Grid lines
    const xGridLines = d3.axisBottom(xScale)
      .tickSize(-(height - margin.top - margin.bottom))
      .tickFormat(() => "")
      .ticks(5);

    const yGridLines = d3.axisLeft(yScale)
      .tickSize(-(width - margin.left - margin.right))
      .tickFormat(() => "")
      .ticks(5);

    svg.append("g")
      .attr("class", "x-grid")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xGridLines)
      .selectAll("line")
      .style("stroke", "#f1f5f9")
      .style("stroke-width", "0.5px")
      .style("opacity", 0.6);

    svg.append("g")
      .attr("class", "y-grid")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yGridLines)
      .selectAll("line")
      .style("stroke", "#f1f5f9")
      .style("stroke-width", "0.5px")
      .style("opacity", 0.6);

    // Diagonal reference line (random classifier)
    svg.append("line")
      .attr("x1", margin.left)
      .attr("y1", height - margin.bottom)
      .attr("x2", width - margin.right)
      .attr("y2", margin.top)
      .attr("stroke", "#9ca3af")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .attr("opacity", 0.7);

    // Generate and draw ROC curve
    const rocData = generateROCData();
    
    const line = d3.line<{fpr: number, tpr: number, threshold: number}>()
      .x(d => xScale(d.fpr))
      .y(d => yScale(d.tpr))
      .curve(d3.curveLinear);

    svg.append("path")
      .datum(rocData)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "#2563eb")
      .attr("stroke-width", 3)
      .style("filter", "drop-shadow(0px 0px 4px rgba(37, 99, 235, 0.3))");

    // Current point on ROC curve
    const currentPoint = svg.append("g").attr("class", "current-point");
    
    currentPoint.append("circle")
      .attr("cx", xScale(metrics.fpr))
      .attr("cy", yScale(metrics.tpr))
      .attr("r", 8)
      .attr("fill", "#ef4444")
      .attr("opacity", 0.4);

    currentPoint.append("circle")
      .attr("cx", xScale(metrics.fpr))
      .attr("cy", yScale(metrics.tpr))
      .attr("r", 4)
      .attr("fill", "#ef4444")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer");

    // Dashed lines from current point
    svg.append("line")
      .attr("x1", xScale(metrics.fpr))
      .attr("y1", yScale(metrics.tpr))
      .attr("x2", xScale(metrics.fpr))
      .attr("y2", height - margin.bottom)
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,2")
      .attr("opacity", 0.7);

    svg.append("line")
      .attr("x1", margin.left)
      .attr("y1", yScale(metrics.tpr))
      .attr("x2", xScale(metrics.fpr))
      .attr("y2", yScale(metrics.tpr))
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,2")
      .attr("opacity", 0.7);

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(4).tickFormat(d3.format(".1f"));
    const yAxis = d3.axisLeft(yScale).ticks(4).tickFormat(d3.format(".1f"));

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .selectAll("text")
      .style("font-size", "10px")
      .style("fill", "#374151");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .selectAll("text")
      .style("font-size", "10px")
      .style("fill", "#374151");

    // Style axes
    svg.selectAll(".domain")
      .style("stroke", "#6b7280")
      .style("stroke-width", "1.5px");

    svg.selectAll(".tick line")
      .style("stroke", "#6b7280")
      .style("stroke-width", "1px");

    // Labels
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 15)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .style("fill", "#374151")
      .text("False Positive Rate");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .style("fill", "#374151")
      .text("True Positive Rate");

    // Title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "700")
      .style("fill", "#1f2937")
      .text("ROC Curve");

    // Calculate AUC (simplified trapezoidal rule)
    let auc = 0;
    for (let i = 1; i < rocData.length; i++) {
      auc += (rocData[i].fpr - rocData[i-1].fpr) * (rocData[i].tpr + rocData[i-1].tpr) / 2;
    }

    svg.append("text")
      .attr("x", width - margin.right - 5)
      .attr("y", height - margin.bottom - 20)
      .attr("text-anchor", "end")
      .style("font-size", "10px")
      .style("font-weight", "600")
      .style("fill", "#2563eb")
      .text(`AUC = ${auc.toFixed(3)}`);

    // Interactive clicking on ROC curve
    svg.append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .attr("fill", "transparent")
      .attr("pointer-events", "all")
      .style("cursor", "crosshair")
      .on("click", function(event) {
        const [mouseX, mouseY] = d3.pointer(event);
        const fpr = xScale.invert(mouseX);
        const tpr = yScale.invert(mouseY);
        
        // Find closest point on ROC curve
        let minDistance = Infinity;
        let closestThreshold = 0.5;
        
        rocData.forEach(point => {
          const distance = Math.sqrt(
            Math.pow(point.fpr - fpr, 2) + Math.pow(point.tpr - tpr, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestThreshold = point.threshold;
          }
        });
        
        setThreshold(Math.max(0, Math.min(1, closestThreshold)));
      });

  }, [metrics, threshold]);

  // Data distribution visualization
  useEffect(() => {
    if (!dataSvgRef.current) return;

    const svg = d3.select(dataSvgRef.current);
    svg.selectAll("*").remove();

    const width = 320;
    const height = 240;
    const margin = { top: 35, right: 42, bottom: 45, left: 42 };

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const xScale = d3.scaleLinear().domain([0, 1]).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([0, 80]).range([height - margin.bottom, margin.top]);

    // Create histograms
    const bins = d3.histogram<DataPoint, number>()
      .domain([0, 1])
      .thresholds(20)
      .value(d => d.score);

    const positiveBins = bins(data.filter(d => d.label === 1));
    const negativeBins = bins(data.filter(d => d.label === 0));

    // Draw negative class histogram
    svg.selectAll(".negative-bar")
      .data(negativeBins)
      .enter()
      .append("rect")
      .attr("class", "negative-bar")
      .attr("x", d => xScale(d.x0!))
      .attr("y", d => yScale(d.length))
      .attr("width", d => xScale(d.x1!) - xScale(d.x0!))
      .attr("height", d => yScale(0) - yScale(d.length))
      .attr("fill", "#3b82f6")
      .attr("opacity", 0.7);

    // Draw positive class histogram
    svg.selectAll(".positive-bar")
      .data(positiveBins)
      .enter()
      .append("rect")
      .attr("class", "positive-bar")
      .attr("x", d => xScale(d.x0!))
      .attr("y", d => yScale(d.length))
      .attr("width", d => xScale(d.x1!) - xScale(d.x0!))
      .attr("height", d => yScale(0) - yScale(d.length))
      .attr("fill", "#ef4444")
      .attr("opacity", 0.7);

    // Threshold line
    svg.append("line")
      .attr("x1", xScale(threshold))
      .attr("y1", margin.top)
      .attr("x2", xScale(threshold))
      .attr("y2", height - margin.bottom)
      .attr("stroke", "#059669")
      .attr("stroke-width", 2.5)
      .attr("stroke-dasharray", "4,3")
      .attr("opacity", 0.8);

    // Threshold label
    svg.append("text")
      .attr("x", xScale(threshold))
      .attr("y", margin.top - 3)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("font-weight", "600")
      .style("fill", "#059669")
      .text(`T = ${threshold.toFixed(2)}`);

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(4).tickFormat(d3.format(".1f"));
    const yAxis = d3.axisLeft(yScale).ticks(4);

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .selectAll("text")
      .style("font-size", "10px")
      .style("fill", "#374151");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .selectAll("text")
      .style("font-size", "10px")
      .style("fill", "#374151");

    // Style axes
    svg.selectAll(".domain")
      .style("stroke", "#6b7280")
      .style("stroke-width", "1.5px");

    svg.selectAll(".tick line")
      .style("stroke", "#6b7280")
      .style("stroke-width", "1px");

    // Labels
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 12)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .style("fill", "#374151")
      .text("Prediction Score");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .style("fill", "#374151")
      .text("Count");

    // Title
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "700")
      .style("fill", "#1f2937")
      .text("Score Distribution");

  }, [data, threshold]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      backgroundColor: "#fff",
      borderRadius: "12px",
      margin: "30px 0"
    }}>
      {/* Threshold Control */}
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
          Classification Threshold =
        </label>
        <input
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(Math.max(0, Math.min(1, parseFloat(e.target.value) || 0.5)))}
          step="0.01"
          min="0"
          max="1"
          style={{
            padding: "8px 12px",
            fontSize: "16px",
            borderRadius: "8px",
            width: "120px",
            textAlign: "center",
            outline: "none",
            transition: "all 0.2s ease"
          }}
        />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          style={{
            width: "300px",
            height: "6px",
            borderRadius: "3px",
            background: "linear-gradient(to right, #ef4444, #f59e0b, #10b981)",
            outline: "none",
            cursor: "pointer"
          }}
        />
        <button
          onClick={regenerateData}
          style={{
            fontSize: "14px",
            fontWeight: "600",
            backgroundColor: "#2e7d32",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.2s ease",
            marginBottom: "-20px"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#2e7d32";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#2e7d32";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Randomize Data
        </button>
      </div>

      {/* Compact 2x2 Grid Layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px",
        maxWidth: "720px",
        width: "100%",
        marginBottom: "20px"
      }}>
        {/* Top Left: ROC Curve */}
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          padding: "10px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <svg 
            ref={rocSvgRef}
            width={320}
            height={320}
            style={{ 
              backgroundColor: "#fff",
              borderRadius: "4px",
              width: "100%",
              height: "auto",
              display: "block"
            }}
          />
        </div>

        {/* Top Right: Data Distribution */}
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          padding: "10px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <svg 
            ref={dataSvgRef}
            width={240}
            height={240}
            style={{ 
              backgroundColor: "#fff",
              borderRadius: "4px",
              width: "100%",
              height: "auto",
              display: "block"
            }}
          />
        </div>

        {/* Bottom Left: Confusion Matrix */}
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          paddingRight: "30px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <h4 style={{ 
            margin: "0 0 15px 0", 
            fontSize: "14px", 
            fontWeight: "600", 
            color: "#374151",
            textAlign: "center"
          }}>
            Confusion Matrix
          </h4>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            position: "relative"
          }}>
            {/* Predicted label */}
            <div style={{ 
              fontSize: "12px", 
              fontWeight: "600", 
              color: "#374151",
              marginBottom: "2px"
            }}>
              Predicted
            </div>
            
            {/* Main matrix container */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}>
              {/* Actual label (vertical) */}
              <div style={{ 
                fontSize: "12px", 
                fontWeight: "600", 
                color: "#374151",
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                height: "90px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                Actual
              </div>

              {/* Matrix content */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px"
              }}>
                {/* Column headers */}
                <div style={{
                  display: "flex",
                  gap: "4px",
                  paddingLeft: "49px"
                }}>
                  <div style={{ 
                    width: "45px", 
                    textAlign: "center", 
                    fontSize: "10px", 
                    fontWeight: "600", 
                    color: "#6b7280",
                    backgroundColor: "#f1f5f9",
                    padding: "3px",
                    borderRadius: "3px"
                  }}>0</div>
                  <div style={{ 
                    width: "45px", 
                    textAlign: "center", 
                    fontSize: "10px", 
                    fontWeight: "600", 
                    color: "#6b7280",
                    backgroundColor: "#f1f5f9",
                    padding: "3px",
                    borderRadius: "3px"
                  }}>1</div>
                </div>

                {/* First row */}
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{ 
                    width: "45px", 
                    textAlign: "center", 
                    fontSize: "10px", 
                    fontWeight: "600", 
                    color: "#6b7280",
                    backgroundColor: "#f1f5f9",
                    padding: "3px",
                    borderRadius: "3px"
                  }}>0</div>
                  {/* TN */}
                  <div style={{ 
                    width: "45px",
                    height: "35px",
                    backgroundColor: "#dbeafe", 
                    border: "2px solid #3b82f6", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#1e40af",
                    borderRadius: "4px"
                  }}>
                    {metrics.tn}
                  </div>
                  {/* FP */}
                  <div style={{ 
                    width: "45px",
                    height: "35px",
                    backgroundColor: "#fee2e2", 
                    border: "2px solid #ef4444", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#dc2626",
                    borderRadius: "4px"
                  }}>
                    {metrics.fp}
                  </div>
                </div>
                
                {/* Second row */}
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{ 
                    width: "45px", 
                    textAlign: "center", 
                    fontSize: "10px", 
                    fontWeight: "600", 
                    color: "#6b7280",
                    backgroundColor: "#f1f5f9",
                    padding: "3px",
                    borderRadius: "3px"
                  }}>1</div>
                  {/* FN */}
                  <div style={{ 
                    width: "45px",
                    height: "35px",
                    backgroundColor: "#fee2e2", 
                    border: "2px solid #ef4444", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#dc2626",
                    borderRadius: "4px"
                  }}>
                    {metrics.fn}
                  </div>
                  {/* TP */}
                  <div style={{ 
                    width: "45px",
                    height: "35px",
                    backgroundColor: "#dcfce7", 
                    border: "2px solid #22c55e", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#16a34a",
                    borderRadius: "4px"
                  }}>
                    {metrics.tp}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Right: Key Metrics */}
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <h4 style={{ 
            margin: "0 0 15px 0", 
            fontSize: "14px", 
            fontWeight: "600", 
            color: "#374151",
            textAlign: "center"
          }}>
            Performance Metrics
          </h4>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px"
          }}>
            {[
              { label: "Recall", value: metrics.recall, color: "#059669" },
              { label: "Precision", value: metrics.precision, color: "#2563eb" },
              { label: "F1 Score", value: metrics.f1, color: "#7c3aed" },
              { label: "Accuracy", value: metrics.accuracy, color: "#dc2626" },
              { label: "Specificity", value: 1 - metrics.fpr, color: "#ea580c" },
              { label: "FPR", value: metrics.fpr, color: "#9333ea" }
            ].map((metric, index) => (
              <div key={index} style={{
                backgroundColor: "#fefefe",
                padding: "6px",
                borderRadius: "5px",
                border: `2px solid ${metric.color}`,
                textAlign: "center",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}>
                <div style={{ fontSize: "10px", color: metric.color, fontWeight: "600", marginBottom: "1px" }}>
                  {metric.label}
                </div>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#1f2937" }}>
                  {metric.value.toFixed(3)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend and Instructions */}
      <div style={{
        marginTop: "25px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "15px"
      }}>
        <div style={{
          display: "flex",
          gap: "30px",
          fontSize: "13px",
          fontWeight: "600",
          flexWrap: "wrap",
          justifyContent: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "15px", height: "15px", backgroundColor: "#ef4444", borderRadius: "3px", opacity: 0.7 }}></div>
            <span style={{ color: "#374151" }}>Positive Class</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "15px", height: "15px", backgroundColor: "#3b82f6", borderRadius: "3px", opacity: 0.7 }}></div>
            <span style={{ color: "#374151" }}>Negative Class</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "15px", height: "3px", backgroundColor: "#059669", borderRadius: "2px" }}></div>
            <span style={{ color: "#374151" }}>Classification Threshold</span>
          </div>
        </div>
        
        <div style={{
          padding: "12px 20px",
          backgroundColor: "#f0f9ff",
          borderRadius: "8px",
          border: "1px solid #0ea5e9",
          fontSize: "13px",
          color: "#0c4a6e",
          textAlign: "center",
          maxWidth: "600px"
        }}>
          💡 <strong>Tip: </strong>
          Click anywhere on the ROC curve to move the threshold, or use the slider above. 
          Watch how the metrics and confusion matrix change as you move along the curve!
        </div>
      </div>
    </div>
  );
};

export default InteractiveROCCurve; 