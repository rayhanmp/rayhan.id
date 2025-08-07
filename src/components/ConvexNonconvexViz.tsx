import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface Point {
  x: number;
  y: number;
}

const ConvexNonconvexViz: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [learningRate, setLearningRate] = useState(0.1);
  const [animationSpeed, setAnimationSpeed] = useState(100);

  // Function definitions
  const convexFunction = (x: number) => 0.5 * x * x + 0.1 * x + 0.5;
  const convexGradient = (x: number) => x + 0.1;
  
  const nonconvexFunction = (x: number) => 
    0.3 * x * x * x * x - 2 * x * x + 0.5 * x + 2;
  const nonconvexGradient = (x: number) => 
    1.2 * x * x * x - 4 * x + 0.5;

  useEffect(() => {
    if (!svgRef.current) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 900;
    const height = 450;
    const margin = { top: 50, right: 50, bottom: 70, left: 90 };
    const plotWidth = (width - 2 * margin.left - margin.right) / 2;
    const plotHeight = height - margin.top - margin.bottom;

    // Set SVG viewBox to ensure everything fits
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    // Create scales with padding
    const xScale = d3.scaleLinear()
      .domain([-3.2, 3.2])
      .range([0, plotWidth]);
    
    const yScaleConvex = d3.scaleLinear()
      .domain([-0.2, 5.2])
      .range([plotHeight, 0]);
    
    const yScaleNonconvex = d3.scaleLinear()
      .domain([-1.2, 4.2])
      .range([plotHeight, 0]);

    // Generate data points for curves
    const xData = d3.range(-3, 3.01, 0.05);
    const convexData = xData.map(x => ({ x, y: convexFunction(x) }));
    const nonconvexData = xData.map(x => ({ x, y: nonconvexFunction(x) }));

    // Line generators
    const convexLine = d3.line<{x: number, y: number}>()
      .x(d => xScale(d.x))
      .y(d => yScaleConvex(d.y))
      .curve(d3.curveCardinal);

    const nonconvexLine = d3.line<{x: number, y: number}>()
      .x(d => xScale(d.x))
      .y(d => yScaleNonconvex(d.y))
      .curve(d3.curveCardinal);

    // Create convex plot
    const convexGroup = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create non-convex plot  
    const nonconvexGroup = svg.append("g")
      .attr("transform", `translate(${margin.left + plotWidth + 60}, ${margin.top})`);

    // Add plot background rectangles
    convexGroup.append("rect")
      .attr("x", -5)
      .attr("y", -5)
      .attr("width", plotWidth + 10)
      .attr("height", plotHeight + 10)
      .style("fill", "rgba(46, 125, 50, 0.05)")
      .style("stroke", "#2e7d32")
      .style("stroke-width", 1)
      .style("stroke-dasharray", "2,2");

    nonconvexGroup.append("rect")
      .attr("x", -5)
      .attr("y", -5)
      .attr("width", plotWidth + 10)
      .attr("height", plotHeight + 10)
      .style("fill", "rgba(198, 40, 40, 0.05)")
      .style("stroke", "#c62828")
      .style("stroke-width", 1)
      .style("stroke-dasharray", "2,2");

    // Add titles
    convexGroup.append("text")
      .attr("x", plotWidth / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", "#2e7d32")
      .text("Convex Function");

    nonconvexGroup.append("text")
      .attr("x", plotWidth / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", "#c62828")
      .text("Non-convex Function");

    // Add grid lines
    [convexGroup, nonconvexGroup].forEach((group, i) => {
      const yScale = i === 0 ? yScaleConvex : yScaleNonconvex;
      
      // Vertical grid lines
      group.selectAll(".grid-vertical")
        .data(xScale.ticks(6))
        .enter()
        .append("line")
        .attr("class", "grid-vertical")
        .attr("x1", d => xScale(d))
        .attr("x2", d => xScale(d))
        .attr("y1", 0)
        .attr("y2", plotHeight)
        .style("stroke", "#e0e0e0")
        .style("stroke-width", 0.5)
        .style("opacity", 0.7);

      // Horizontal grid lines
      group.selectAll(".grid-horizontal")
        .data(yScale.ticks(5))
        .enter()
        .append("line")
        .attr("class", "grid-horizontal")
        .attr("x1", 0)
        .attr("x2", plotWidth)
        .attr("y1", d => yScale(d))
        .attr("y2", d => yScale(d))
        .style("stroke", "#e0e0e0")
        .style("stroke-width", 0.5)
        .style("opacity", 0.7);
    });

    // Add axes
    [convexGroup, nonconvexGroup].forEach((group, i) => {
      const yScale = i === 0 ? yScaleConvex : yScaleNonconvex;
      
      // X axis
      group.append("g")
        .attr("transform", `translate(0, ${plotHeight})`)
        .call(d3.axisBottom(xScale).ticks(6))
        .style("font-size", "11px");
      
      // Y axis
      group.append("g")
        .call(d3.axisLeft(yScale).ticks(5))
        .style("font-size", "11px");
      
      // Axis labels
      group.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -60)
        .attr("x", -(plotHeight / 2))
        .style("text-anchor", "middle")
        .style("font-size", "13px")
        .style("font-weight", "500")
        .style("fill", "#555")
        .text("Loss");
      
      group.append("text")
        .attr("x", plotWidth / 2)
        .attr("y", plotHeight + 50)
        .style("text-anchor", "middle")
        .style("font-size", "13px")
        .style("font-weight", "500")
        .style("fill", "#555")
        .text("Parameter");
    });

    // Add function curves
    try {
      convexGroup.append("path")
        .datum(convexData)
        .attr("fill", "none")
        .attr("stroke", "#2e7d32")
        .attr("stroke-width", 4)
        .attr("d", convexLine);

      nonconvexGroup.append("path")
        .datum(nonconvexData)
        .attr("fill", "none")
        .attr("stroke", "#c62828")
        .attr("stroke-width", 4)
        .attr("d", nonconvexLine);
    } catch (error) {
      console.error('Error adding function curves:', error);
    }

    // Animated gradient descent function
    const runGradientDescent = (group: any, func: (x: number) => number, grad: (x: number) => number, yScale: any, startX: number, color: string) => {
      // Use a local flag instead of React state to avoid re-renders
      if (group.attr('data-animating') === 'true') {
        return;
      }
      
      group.attr('data-animating', 'true');
      
      let currentX = startX;
      const path: Point[] = [];
      const maxIterations = 80;
      
      // Pre-calculate the entire path
      for (let i = 0; i < maxIterations; i++) {
        const y = func(currentX);
        path.push({ x: currentX, y });
        
        const gradient = grad(currentX);
        if (Math.abs(gradient) < 0.001) break;
        
        currentX = currentX - learningRate * gradient;
        if (currentX < -3.2 || currentX > 3.2) break;
      }
      
      // Clear previous paths
      group.selectAll(".descent-path").remove();
      group.selectAll(".descent-point").remove();
      
      // Add starting point immediately
      group.append("circle")
        .attr("class", "descent-point start-point")
        .attr("cx", xScale(path[0].x))
        .attr("cy", yScale(path[0].y))
        .attr("r", 8)
        .style("fill", color)
        .style("stroke", "white")
        .style("stroke-width", 3)
        .style("opacity", 1);
      
      // Animate the descent step by step
      const animateStep = (index: number) => {
        if (index >= path.length) {
          group.attr('data-animating', 'false');
          return;
        }
        
        const point = path[index];
        const isLastPoint = index === path.length - 1;
        
        // Skip the first point since we already added it
        if (index === 0) {
          setTimeout(() => animateStep(index + 1), animationSpeed);
          return;
        }
        
        // Add current point with animation
        const circle = group.append("circle")
          .attr("class", "descent-point")
          .attr("cx", xScale(point.x))
          .attr("cy", yScale(point.y))
          .attr("r", 2)
          .style("fill", color)
          .style("stroke", "white")
          .style("stroke-width", isLastPoint ? 2 : 1)
          .style("opacity", 0.5);
        
        // Animate point appearance
        circle.transition()
          .duration(Math.min(animationSpeed * 0.3, 150))
          .attr("r", isLastPoint ? 7 : 4)
          .style("opacity", isLastPoint ? 1 : 0.8);
        
        // Add path segment from previous point
        const prevPoint = path[index - 1];
        const line = group.append("line")
          .attr("class", "descent-path")
          .attr("x1", xScale(prevPoint.x))
          .attr("y1", yScale(prevPoint.y))
          .attr("x2", xScale(prevPoint.x))
          .attr("y2", yScale(prevPoint.y))
          .style("stroke", color)
          .style("stroke-width", 2)
          .style("stroke-dasharray", "5,3")
          .style("opacity", 0.7);
        
        // Animate line drawing
        line.transition()
          .duration(Math.min(animationSpeed * 0.7, 200))
          .attr("x2", xScale(point.x))
          .attr("y2", yScale(point.y));
        
        // Add floating loss value indicator
        if (index % 10 === 0 || isLastPoint) {
          const lossValue = func(point.x);
          
          const lossText = group.append("text")
            .attr("class", "descent-point loss-indicator")
            .attr("x", xScale(point.x))
            .attr("y", yScale(point.y) - 20)
            .attr("text-anchor", "middle")
            .style("font-size", "11px")
            .style("font-weight", "bold")
            .style("fill", color)
            .style("opacity", 0)
            .text(lossValue.toFixed(2));
          
          lossText.transition()
            .duration(200)
            .style("opacity", 0.9)
            .transition()
            .delay(animationSpeed)
            .duration(300)
            .style("opacity", 0)
            .remove();
        }
        
        // Continue to next step
        setTimeout(() => animateStep(index + 1), animationSpeed);
      };
      
      // Start animation from the first point
      animateStep(0);
    };

    // Add click handlers
    convexGroup.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", plotWidth)
      .attr("height", plotHeight)
      .style("fill", "rgba(46, 125, 50, 0.1)")
      .style("cursor", "crosshair")
      .style("pointer-events", "all")
      .on("click", function(event) {
        const [mouseX, mouseY] = d3.pointer(event);
        const x = xScale.invert(mouseX);
        
        if (x < -3.2 || x > 3.2) {
          return;
        }
        
        runGradientDescent(convexGroup, convexFunction, convexGradient, yScaleConvex, x, "#1b5e20");
      });

    nonconvexGroup.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", plotWidth)
      .attr("height", plotHeight)
      .style("fill", "rgba(198, 40, 40, 0.1)")
      .style("cursor", "crosshair")
      .style("pointer-events", "all")
      .on("click", function(event) {
        const [mouseX, mouseY] = d3.pointer(event);
        const x = xScale.invert(mouseX);
        
        if (x < -3.2 || x > 3.2) {
          return;
        }
        
        runGradientDescent(nonconvexGroup, nonconvexFunction, nonconvexGradient, yScaleNonconvex, x, "#b71c1c");
      });

  }, [learningRate, animationSpeed]);

  const resetVisualization = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll(".descent-path").remove();
    svg.selectAll(".descent-point").remove();
    // Reset animation flags
    svg.selectAll("g").attr('data-animating', 'false');
  };

  return (
    <div style={{ 
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "20px",
      backgroundColor: "#fff",
      margin: "20px 0"
    }}>
      
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        gap: "20px", 
        marginBottom: "15px",
        flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontSize: "14px", fontWeight: "500" }}>Learning Rate:</label>
          <input
            type="range"
            min="0.01"
            max="0.5"
            step="0.01"
            value={learningRate}
            onChange={(e) => setLearningRate(parseFloat(e.target.value))}
            disabled={false}
            style={{ width: "120px" }}
          />
          <span style={{ fontSize: "12px", color: "#666", minWidth: "35px" }}>{learningRate.toFixed(2)}</span>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontSize: "14px", fontWeight: "500" }}>Animation Speed:</label>
          <input
            type="range"
            min="50"
            max="500"
            step="50"
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
            disabled={false}
            style={{ width: "120px" }}
          />
          <span style={{ fontSize: "12px", color: "#666", minWidth: "50px" }}>{animationSpeed}ms</span>
        </div>
      </div>
      
      <div style={{ textAlign: "center", overflow: "hidden" }}>
        <svg
          ref={svgRef}
          width="900"
          height="450"
          style={{ 
            maxWidth: "100%", 
            height: "auto",
          }}
        />
      </div>
      
    </div>
  );
};

export default ConvexNonconvexViz; 