import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

/**
 * Interactive visualization of convex vs strictly convex functions.
 * Shows heat-map, contour lines, and gradient descent animations.
 */
const ConvexNotStrict: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [functionType, setFunctionType] = useState<'not-strict' | 'strict'>('not-strict');
  const [isAnimating, setIsAnimating] = useState(false);
  const width = 600;
  const height = 450;
  const margin = { top: 20, right: 20, bottom: 60, left: 70 };

  // Function definitions
  const functions = {
    'not-strict': {
      name: 'f(w₁,w₂) = w₁²',
      func: (w1: number, w2: number) => w1 * w1,
      grad: (w1: number, w2: number) => [2 * w1, 0], // gradient
    },
    'strict': {
      name: 'f(w₁,w₂) = w₁² + w₂²',
      func: (w1: number, w2: number) => w1 * w1 + w2 * w2,
      grad: (w1: number, w2: number) => [2 * w1, 2 * w2], // gradient  
    }
  };

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // clear on re-render

    const currentFunc = functions[functionType];

    // --- 1. Scales -----------------------------------------------------------
    const xScale = d3
      .scaleLinear()
      .domain([-3, 3])
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain([-3, 3])
      .range([height - margin.bottom, margin.top]); // invert y for SVG

    // --- 2. Generate a grid of f values -------------------------------------
    const gridSize = 80;                // resolution (80×80)
    const values: number[] = [];
    const xs: number[] = [];
    const ys: number[] = [];

    for (let j = 0; j < gridSize; ++j) {
      const w2 = -3 + (6 * j) / (gridSize - 1); // y direction
      for (let i = 0; i < gridSize; ++i) {
        const w1 = -3 + (6 * i) / (gridSize - 1); // x direction
        xs.push(w1);
        ys.push(w2);
        values.push(currentFunc.func(w1, w2));
      }
    }

    const color = d3
      .scaleSequential(d3.interpolateViridis)
      .domain(d3.extent(values) as [number, number]);

    // --- 3. Draw heat-map as rects ------------------------------------------
    const cellWidth = (xScale(3) - xScale(-3)) / (gridSize - 1);
    const cellHeight = (yScale(-3) - yScale(3)) / (gridSize - 1);

    svg
      .append("g")
      .selectAll("rect")
      .data(values)
      .enter()
      .append("rect")
      .attr("x", (_, idx) => xScale(xs[idx]) - cellWidth / 2)
      .attr("y", (_, idx) => yScale(ys[idx]) - cellHeight / 2)
      .attr("width", cellWidth)
      .attr("height", cellHeight)
      .attr("fill", d => color(d))
      .attr("stroke-width", 0);

    // --- 4. Overlay contour lines ------------------------------------------
    const contours = d3
      .contours()
      .size([gridSize, gridSize])
      .thresholds(d3.range(0.5, 15, 0.8)) // adjust thresholds based on function
      (values);

    svg
      .append("g")
      .selectAll("path")
      .data(contours)
      .enter()
      .append("path")
      .attr(
        "d",
        d3
          .geoPath<d3.ContourMultiPolygon>()
          .projection(
            d3
              .geoTransform({
                point: function (w1, w2) {
                  this.stream.point(xScale(-3 + (6 * w1) / (gridSize - 1)), yScale(-3 + (6 * w2) / (gridSize - 1)));
                },
              })
          )
      )
      .attr("fill", "none")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("opacity", 0.8);

    // --- 5. Interactive click area ------------------------------------------
    const clickGroup = svg.append("g").attr("class", "click-area");
    
    clickGroup
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .attr("fill", "transparent")
      .attr("pointer-events", "all")
      .style("cursor", "crosshair")
      .on("click", function(event) {
        if (isAnimating) return;
        
        const [mouseX, mouseY] = d3.pointer(event);
        const w1 = xScale.invert(mouseX);
        const w2 = yScale.invert(mouseY);
        
        // Run gradient descent from this point
        runGradientDescent(w1, w2, svg, xScale, yScale, currentFunc);
      })
      .on("mouseover", function() {
        if (!isAnimating) {
          d3.select(this).style("cursor", "crosshair");
        }
      });

    // --- 6. Axes -------------------------------------------------------------
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis);

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis);

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 25)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("w₁");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("w₂");

    // --- 7. Instructions -----------------------------------------------------
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#666")

  }, [functionType, width, height, margin, isAnimating]);

  // Gradient descent animation
  const runGradientDescent = (
    startW1: number, 
    startW2: number, 
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    funcDef: typeof functions['not-strict']
  ) => {
    setIsAnimating(true);
    
    // Clear previous paths
    svg.selectAll(".gradient-path").remove();
    svg.selectAll(".gradient-points").remove();
    svg.selectAll(".gradient-arrows").remove();

    const path: [number, number][] = [];
    let currentW1 = startW1;
    let currentW2 = startW2;
    const learningRate = 0.1;
    const maxSteps = 50;
    
    // Generate path
    for (let step = 0; step < maxSteps; step++) {
      path.push([currentW1, currentW2]);
      
      const [gradW1, gradW2] = funcDef.grad(currentW1, currentW2);
      
      // Stop if gradient is very small
      if (Math.abs(gradW1) < 0.01 && Math.abs(gradW2) < 0.01) break;
      
      currentW1 -= learningRate * gradW1;
      currentW2 -= learningRate * gradW2;
      
      // Keep within bounds
      currentW1 = Math.max(-3, Math.min(3, currentW1));
      currentW2 = Math.max(-3, Math.min(3, currentW2));
    }

    // Draw smooth path with gradient
    const line = d3.line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveCatmullRom.alpha(0.5)); // Smooth curves

    // Create gradient definition
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "path-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", xScale(path[0][0])).attr("y1", yScale(path[0][1]))
      .attr("x2", xScale(path[path.length-1][0])).attr("y2", yScale(path[path.length-1][1]));

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#00ff88")
      .attr("stop-opacity", 0.9);

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#ff3366")
      .attr("stop-opacity", 0.9);

    // Main path with glow effect
    const pathElement = svg
      .append("path")
      .attr("class", "gradient-path")
      .datum(path)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "url(#path-gradient)")
      .attr("stroke-width", 4)
      .attr("opacity", 0)
      .style("filter", "drop-shadow(0px 0px 6px rgba(255, 51, 102, 0.6))");

    // Animate path drawing
    const totalLength = pathElement.node()?.getTotalLength() || 0;
    
    pathElement
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .attr("opacity", 1)
      .transition()
      .duration(3000)
      .attr("stroke-dashoffset", 0)
      .on("end", () => {
        // Add direction lines
        addDirectionLines(svg, path, xScale, yScale);
        
        // Add pulsing final point with glow
        const finalPoint = svg
          .append("g")
          .attr("class", "gradient-points");

        // Glow effect
        finalPoint
          .append("circle")
          .attr("cx", xScale(path[path.length - 1][0]))
          .attr("cy", yScale(path[path.length - 1][1]))
          .attr("r", 0)
          .attr("fill", "#ff3366")
          .attr("opacity", 0.3)
          .transition()
          .duration(800)
          .attr("r", 15)
          .transition()
          .duration(1000)
          .attr("r", 12)
          .attr("opacity", 0.1);

        // Main point
        finalPoint
          .append("circle")
          .attr("cx", xScale(path[path.length - 1][0]))
          .attr("cy", yScale(path[path.length - 1][1]))
          .attr("r", 0)
          .attr("fill", "#ff3366")
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .style("filter", "drop-shadow(0px 0px 4px rgba(255, 51, 102, 0.8))")
          .transition()
          .duration(800)
          .attr("r", 8)
          .on("end", () => {
            // Wait for direction lines to finish before allowing new animations
            setTimeout(() => setIsAnimating(false), 1200);
          });
      });

    // Add animated starting point with pulse
    const startPoint = svg
      .append("g")
      .attr("class", "gradient-points");

    // Pulse effect
    startPoint
      .append("circle")
      .attr("cx", xScale(startW1))
      .attr("cy", yScale(startW2))
      .attr("r", 0)
      .attr("fill", "#00ff88")
      .attr("opacity", 0.4)
      .transition()
      .duration(300)
      .attr("r", 12)
      .transition()
      .duration(600)
      .attr("r", 8)
      .attr("opacity", 0.2);

    // Main starting point
    startPoint
      .append("circle")
      .attr("cx", xScale(startW1))
      .attr("cy", yScale(startW2))
      .attr("r", 0)
      .attr("fill", "#00ff88")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("filter", "drop-shadow(0px 0px 4px rgba(0, 255, 136, 0.8))")
      .transition()
      .duration(300)
      .attr("r", 7);
  };

    const addDirectionLines = (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    path: [number, number][],
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>
  ) => {
    // Show dotted lines from early points toward the final destination
    const finalPoint = path[path.length - 1];
    const directionPoints = path.filter((_, i) => i > 0 && i < path.length - 1 && i % Math.max(1, Math.floor(path.length / 6)) === 0);
    
    directionPoints.forEach(([w1, w2], i) => {
      const startX = xScale(w1);
      const startY = yScale(w2);
      const endX = xScale(finalPoint[0]);
      const endY = yScale(finalPoint[1]);
      
      // Calculate direction vector and shorten the line
      const dx = endX - startX;
      const dy = endY - startY;
      const length = Math.sqrt(dx * dx + dy * dy);
      const scale = Math.min(60, length * 0.4); // Limit line length
      
      const normalizedX = startX + (dx / length) * scale;
      const normalizedY = startY + (dy / length) * scale;
      
      // Create dotted direction line
      svg
        .append("line")
        .attr("class", "gradient-arrows")
        .attr("x1", startX)
        .attr("y1", startY)
        .attr("x2", normalizedX)
        .attr("y2", normalizedY)
        .attr("stroke", "#ff9900")
        .attr("stroke-width", 3)
        .attr("stroke-dasharray", "8,4")
        .attr("stroke-linecap", "round")
        .attr("opacity", 0)
        .transition()
        .delay(i * 200)
        .duration(600)
        .attr("opacity", 0.9);
    });
  };

  // No need for arrowhead markers anymore since we're using simple dotted lines
  useEffect(() => {
    // This useEffect can be removed or kept empty for future marker needs
  }, []);

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column",
      alignItems: "center",
      margin: "20px 0",
      padding: "20px",
      backgroundColor: "#fff",
      borderRadius: "8px",
    }}>
      {/* Controls */}
      <div style={{ 
        marginBottom: "20px",
        display: "flex",
        gap: "15px",
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: "center"
      }}>
        <button
          onClick={() => setFunctionType('not-strict')}
          disabled={isAnimating}
          style={{
            border: functionType === 'not-strict' ? "2px solid #007acc" : "1px solid #ccc",
            backgroundColor: functionType === 'not-strict' ? "#e6f3ff" : "#fff",
            borderRadius: "6px",
            cursor: isAnimating ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: functionType === 'not-strict' ? "600" : "normal"
          }}
        >
          Convex (Not Strict)
        </button>
        <button
          onClick={() => setFunctionType('strict')}
          disabled={isAnimating}
          style={{
            border: functionType === 'strict' ? "2px solid #007acc" : "1px solid #ccc",
            backgroundColor: functionType === 'strict' ? "#e6f3ff" : "#fff",
            borderRadius: "6px",
            cursor: isAnimating ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: functionType === 'strict' ? "600" : "normal"
          }}
        >
          Strictly Convex
        </button>
      </div>

      {/* Function info */}
      <div style={{ textAlign: "center", marginBottom: "15px" }}>
        <h4 style={{ 
          margin: "0 0 5px 0", 
          color: "#333",
          fontSize: "16px",
          fontWeight: "600"
        }}>
          {functions[functionType].name}
        </h4>
        <p style={{ 
          margin: "0", 
          fontSize: "14px", 
          color: "#666",
          fontStyle: "italic"
        }}>
          {functions[functionType].description}
        </p>
      </div>

      {/* Visualization */}
      <svg ref={svgRef} width={width} height={height} style={{ border: "1px solid #ddd" }} />
      
      {/* Legend */}
      <div style={{ 
        marginTop: "15px", 
        fontSize: "12px", 
        color: "#666",
        textAlign: "center",
        maxWidth: "550px",
        lineHeight: "1.4"
      }}>
                 <div style={{ marginBottom: "8px" }}>
           <span style={{ color: "#00ff88", fontWeight: "bold", textShadow: "0 0 4px rgba(0,255,136,0.5)" }}>●</span> Start Point &nbsp;&nbsp;
           <span style={{ color: "#ff3366", fontWeight: "bold", textShadow: "0 0 4px rgba(255,51,102,0.5)" }}>●</span> End Point &nbsp;&nbsp;
           <span style={{ 
             background: "linear-gradient(90deg, #00ff88, #ff3366)",
             WebkitBackgroundClip: "text",
             WebkitTextFillColor: "transparent",
             fontWeight: "bold"
           }}>━</span> Gradient Descent Path &nbsp;&nbsp;
                       <span style={{ color: "#ffaa44", fontWeight: "bold", textShadow: "0 0 3px rgba(255,170,68,0.5)" }}>⋯</span> Direction Lines
         </div>
      </div>
    </div>
  );
};

export default ConvexNotStrict; 