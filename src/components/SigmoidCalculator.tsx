import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";

const SigmoidCalculator: React.FC = () => {
  const [zValue, setZValue] = useState<number>(0);
  const [sigmaValue, setSigmaValue] = useState<number>(0.5);
  const precision = 20; // Fixed at 20 decimals
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Calculate sigmoid function with high precision
  const calculateSigmoid = (z: number): number => {
    // Handle extreme values to prevent overflow/underflow
    if (z > 500) return 1;
    if (z < -500) return 0;
    return 1 / (1 + Math.exp(-z));
  };

  // Update sigma value when z changes
  useEffect(() => {
    setSigmaValue(calculateSigmoid(zValue));
  }, [zValue]);

  // D3.js visualization
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 600;
    const height = 400;
    const margin = { top: 50, right: 50, bottom: 70, left: 80 };

    // Set viewBox for proper scaling
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([-20, 20])
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([height - margin.bottom, margin.top]);

    // Generate sigmoid curve data
    const curveData: [number, number][] = [];
    for (let z = -20; z <= 20; z += 0.1) {
      curveData.push([z, calculateSigmoid(z)]);
    }

    // Create line generator
    const line = d3
      .line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .curve(d3.curveBasis);

    // Add grid lines with improved styling
    const xGridLines = d3.axisBottom(xScale)
      .tickSize(-(height - margin.top - margin.bottom))
      .tickFormat(() => "")
      .ticks(10);

    const yGridLines = d3.axisLeft(yScale)
      .tickSize(-(width - margin.left - margin.right))
      .tickFormat(() => "")
      .ticks(5);

    svg.append("g")
      .attr("class", "x-grid")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xGridLines)
      .selectAll("line")
      .style("stroke", "#e5e7eb")
      .style("stroke-width", "1px")
      .style("opacity", 0.8);

    svg.append("g")
      .attr("class", "y-grid")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yGridLines)
      .selectAll("line")
      .style("stroke", "#e5e7eb")
      .style("stroke-width", "1px")
      .style("opacity", 0.8);

    // Draw sigmoid curve with enhanced styling
    svg
      .append("path")
      .datum(curveData)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "#2e7d32")
      .attr("stroke-width", 4)
      .style("filter", "drop-shadow(0px 0px 6px rgba(59, 130, 246, 0.4))");

    // Add current point
    const currentPoint = svg
      .append("g")
      .attr("class", "current-point");

    // Glow effect for current point
    currentPoint
      .append("circle")
      .attr("cx", xScale(zValue))
      .attr("cy", yScale(sigmaValue))
      .attr("r", 8)
      .attr("fill", "#ff3366")
      .attr("opacity", 0.3);

    // Main current point
    currentPoint
      .append("circle")
      .attr("cx", xScale(zValue))
      .attr("cy", yScale(sigmaValue))
      .attr("r", 5)
      .attr("fill", "#ff3366")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("filter", "drop-shadow(0px 2px 4px rgba(255, 51, 102, 0.5))");

    // Add vertical line from point to x-axis
    svg
      .append("line")
      .attr("x1", xScale(zValue))
      .attr("y1", yScale(sigmaValue))
      .attr("x2", xScale(zValue))
      .attr("y2", height - margin.bottom)
      .attr("stroke", "#ff3366")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,2")
      .attr("opacity", 0.7);

    // Add horizontal line from point to y-axis
    svg
      .append("line")
      .attr("x1", margin.left)
      .attr("y1", yScale(sigmaValue))
      .attr("x2", xScale(zValue))
      .attr("y2", yScale(sigmaValue))
      .attr("stroke", "#ff3366")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,2")
      .attr("opacity", 0.7);

    // Axes with improved styling
    const xAxis = d3.axisBottom(xScale).ticks(10);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#374151");

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .selectAll("text")
      .style("font-size", "12px")
      .style("fill", "#374151");

    // Style axis lines
    svg.selectAll(".domain")
      .style("stroke", "#6b7280")
      .style("stroke-width", "1.5px");

    svg.selectAll(".tick line")
      .style("stroke", "#6b7280")
      .style("stroke-width", "1px");

    // Axis labels with better positioning
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "600")
      .style("fill", "#374151")
      .text("z");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "600")
      .style("fill", "#374151")
      .text("σ(z)");

    // Interactive clicking on the curve
    svg
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .attr("fill", "transparent")
      .attr("pointer-events", "all")
      .style("cursor", "crosshair")
      .on("click", function(event) {
        const [mouseX] = d3.pointer(event);
        const newZ = xScale.invert(mouseX);
        const clampedZ = Math.max(-20, Math.min(20, newZ));
        setZValue(Number(clampedZ.toFixed(2)));
      });

  }, [zValue, sigmaValue]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "25px",
      backgroundColor: "#fff",
      borderRadius: "12px",
    }}>
      {/* Main Calculator */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        maxWidth: "500px"
      }}>
        
        {/* Input Section */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          flexWrap: "wrap",
          justifyContent: "center"
        }}>
          <label style={{
            fontSize: "16px",
            fontWeight: "500",
            color: "#374151"
          }}>
            z =
          </label>
          <input
            type="number"
            value={zValue}
            onChange={(e) => setZValue(Math.max(-20, Math.min(20, parseFloat(e.target.value) || 0)))}
            step="0.1"
            min="-20"
            max="20"
            style={{
              padding: "8px 12px",
              fontSize: "16px",
              borderRadius: "8px",
              width: "120px",
              textAlign: "center",
              outline: "none",
              transition: "all 0.2s ease"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#3b82f6";
              e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#d1d5db";
              e.target.style.boxShadow = "none";
            }}
          />
          <input
            type="range"
            min="-20"
            max="20"
            step="0.01"
            value={Math.max(-20, Math.min(20, zValue))}
            onChange={(e) => setZValue(parseFloat(e.target.value))}
            style={{
              width: "250px",
              height: "6px",
              borderRadius: "3px",
              background: "linear-gradient(to right, #ef4444, #f59e0b, #10b981)",
              outline: "none",
              cursor: "pointer"
            }}
          />
        </div>

        <div style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "10px",
          textAlign: "center",
          width: "100%"
        }}>
          <div style={{
            fontSize: "18px",
            marginBottom: "10px",
            color: "#374151"
          }}>
            σ({zValue.toFixed(3)}) = 1 / (1 + e<sup>-{zValue.toFixed(3)}</sup>)
          </div>
          <div style={{
            fontSize: "20px",
            fontWeight: "bold",
            color: "#000",
            padding: "15px",
            backgroundColor: "#fafafa",
            borderRadius: "8px",
            fontFamily: "Monaco, 'Cascadia Code', 'Roboto Mono', monospace",
            wordBreak: "break-all",
            lineHeight: "1.4"
          }}>
            = {sigmaValue.toFixed(precision)}
          </div>
        </div>

                {/* D3.js Graph */}
        <div style={{
          width: "100%",
          display: "flex",
          justifyContent: "center"
        }}>
          <div style={{
            backgroundColor: "#fff",
            padding: "15px",
            borderRadius: "10px",
          }}>
            <svg 
               ref={svgRef} 
               width={600} 
               height={400}
               style={{ 
                 borderRadius: "8px",
                 backgroundColor: "#fff"
               }} 
             />
            <div style={{
              textAlign: "center",
              fontSize: "12px",
              color: "#6b7280"
            }}>
                Click anywhere on the graph to set z value
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SigmoidCalculator; 