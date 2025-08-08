import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface DataPoint {
  x: number;
  y: number;
  label: 0 | 1;
}

interface ModelState {
  epoch: number;
  weights: [number, number, number]; // [w0 (bias), w1, w2]
  loss: number;
  accuracy: number;
}

const LogisticRegressionLearning: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [learningRate, setLearningRate] = useState(0.1);
  const [trainingSpeed, setTrainingSpeed] = useState(200);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [currentLoss, setCurrentLoss] = useState(0);
  const [currentAccuracy, setCurrentAccuracy] = useState(0);
  const [currentWeights, setCurrentWeights] = useState<[number, number, number]>([0, 0, 0]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 700 });

  // Generate sample data for binary classification
  const generateData = (): DataPoint[] => {
    const data: DataPoint[] = [];
    
    // Class 0 points (bottom-left cluster)
    for (let i = 0; i < 25; i++) {
      data.push({
        x: Math.random() * 3 + 1 + Math.random() * 0.5,
        y: Math.random() * 3 + 1 + Math.random() * 0.5,
        label: 0
      });
    }
    
    // Class 1 points (top-right cluster)
    for (let i = 0; i < 25; i++) {
      data.push({
        x: Math.random() * 3 + 4 + Math.random() * 0.5,
        y: Math.random() * 3 + 4 + Math.random() * 0.5,
        label: 1
      });
    }
    
    // Add some noise points for more realistic data
    for (let i = 0; i < 10; i++) {
      data.push({
        x: Math.random() * 6 + 1,
        y: Math.random() * 6 + 1,
        label: Math.random() > 0.5 ? 1 : 0
      });
    }
    
    return data;
  };

  const sigmoid = (z: number): number => {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, z)))); // Clamp to prevent overflow
  };

  const predict = (x: number, y: number, weights: [number, number, number]): number => {
    const z = weights[0] + weights[1] * x + weights[2] * y;
    return sigmoid(z);
  };

  const calculateLoss = (data: DataPoint[], weights: [number, number, number]): number => {
    let loss = 0;
    for (const point of data) {
      const prediction = predict(point.x, point.y, weights);
      const clampedPred = Math.max(1e-15, Math.min(1 - 1e-15, prediction));
      loss += -(point.label * Math.log(clampedPred) + (1 - point.label) * Math.log(1 - clampedPred));
    }
    return loss / data.length;
  };

  const calculateAccuracy = (data: DataPoint[], weights: [number, number, number]): number => {
    let correct = 0;
    for (const point of data) {
      const prediction = predict(point.x, point.y, weights);
      const predictedClass = prediction >= 0.5 ? 1 : 0;
      if (predictedClass === point.label) correct++;
    }
    return correct / data.length;
  };

  const trainOneEpoch = (data: DataPoint[], weights: [number, number, number], lr: number): [number, number, number] => {
    const gradients: [number, number, number] = [0, 0, 0];
    
    // Calculate gradients
    for (const point of data) {
      const prediction = predict(point.x, point.y, weights);
      const error = prediction - point.label;
      
      gradients[0] += error; // bias gradient
      gradients[1] += error * point.x; // w1 gradient
      gradients[2] += error * point.y; // w2 gradient
    }
    
    // Average gradients and update weights
    const n = data.length;
    return [
      weights[0] - lr * gradients[0] / n,
      weights[1] - lr * gradients[1] / n,
      weights[2] - lr * gradients[2] / n
    ];
  };

  // Handle responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const newWidth = Math.max(400, Math.min(containerWidth - 40, 1200)); // Min 400px, max 1200px
        
        // Calculate height with minimum constraint
        const aspectBasedHeight = newWidth * 0.75; // height/width ratio
        const minHeight = 600; // Minimum height to prevent cropping
        const maxHeight = 900; // Maximum height for very wide screens
        const newHeight = Math.max(minHeight, Math.min(aspectBasedHeight, maxHeight));
        
        setDimensions({
          width: newWidth,
          height: newHeight
        });
      }
    };

    // Use timeout to ensure container is rendered
    const timeoutId = setTimeout(updateDimensions, 0);

    // Add resize listener
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = dimensions.width;
    const height = dimensions.height;
    const margin = { top: 20, right: 50, bottom: 50, left: 50 };
    const mainPlotHeight = Math.round(height * 0.5); // 50% of total height
    const lossPlotHeight = Math.round(height * 0.2); // 25% of total height
    const plotWidth = width - margin.left - margin.right;

    // Set up scales
    const xScale = d3.scaleLinear().domain([0, 8]).range([0, plotWidth]);
    const yScale = d3.scaleLinear().domain([0, 8]).range([mainPlotHeight, 0]);
    const lossXScale = d3.scaleLinear().domain([0, 300]).range([0, plotWidth]); // Match epoch range
    const lossYScale = d3.scaleLinear().domain([0, 1]).range([lossPlotHeight, 0]);

    // Create main plot group
    const mainGroup = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create loss plot group (positioned below main plot)
    const lossGroup = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top + mainPlotHeight + 80})`);

    // Add plot backgrounds
    mainGroup.append("rect")
      .attr("width", plotWidth)
      .attr("height", mainPlotHeight)
      .style("fill", "#fafafa")
      .style("stroke", "#ddd");

    lossGroup.append("rect")
      .attr("width", plotWidth)
      .attr("height", lossPlotHeight)
      .style("fill", "#fafafa")
      .style("stroke", "#ddd");

    // Add axes for main plot
    mainGroup.append("g")
      .attr("transform", `translate(0, ${mainPlotHeight})`)
      .call(d3.axisBottom(xScale))
      .append("text")
      .attr("x", plotWidth / 2)
      .attr("y", 35)
      .style("text-anchor", "middle")
      .style("fill", "black")
      .style("font-size", "12px")
      .text("Feature 1");

    mainGroup.append("g")
      .call(d3.axisLeft(yScale))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -35)
      .attr("x", -mainPlotHeight / 2)
      .style("text-anchor", "middle")
      .style("fill", "black")
      .style("font-size", "12px")
      .text("Feature 2");

    // Add axes for loss plot
    lossGroup.append("g")
      .attr("transform", `translate(0, ${lossPlotHeight})`)
      .call(d3.axisBottom(lossXScale).ticks(10))
      .append("text")
      .attr("x", plotWidth / 2)
      .attr("y", 35)
      .style("text-anchor", "middle")
      .style("fill", "black")
      .style("font-size", "12px")
      .text("Epoch");

    lossGroup.append("g")
      .call(d3.axisLeft(lossYScale).ticks(5))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -35)
      .attr("x", -lossPlotHeight / 2)
      .style("text-anchor", "middle")
      .style("fill", "black")
      .style("font-size", "12px")
      .text("Loss");

    // Add titles
    mainGroup.append("text")
      .attr("x", plotWidth / 2)
      .attr("y", -5)
      .style("text-anchor", "middle")
      .style("font-weight", "bold")
      .style("font-size", "14px")

    lossGroup.append("text")
      .attr("x", plotWidth / 2)
      .attr("y", -15)
      .style("text-anchor", "middle")
      .style("font-weight", "bold")
      .style("font-size", "14px")
      .text("Loss Curve");

    // Generate and store data
    const data = generateData();


    // Add data points
    mainGroup.selectAll(".data-point")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "data-point")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", 4)
      .style("fill", d => d.label === 1 ? "#e74c3c" : "#3498db")
      .style("stroke", "white")
      .style("stroke-width", 1)
      .style("opacity", 0.8);

    // Initialize weights randomly
    let weights: [number, number, number] = [
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ];

    const lossHistory: { epoch: number; loss: number; accuracy: number }[] = [];

    // Training function
    const trainModel = () => {
      if (isTraining) return;
      
      setIsTraining(true);
      setCurrentEpoch(0);
      
      // Reset weights
      weights = [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
      setCurrentWeights([...weights]); // Initialize displayed weights
      lossHistory.length = 0;
      
      // Clear previous elements
      mainGroup.selectAll(".decision-boundary").remove();
      mainGroup.selectAll(".probability-contour").remove();
      lossGroup.selectAll(".loss-line").remove();
      lossGroup.selectAll(".loss-point").remove();

      const maxEpochs = 300;
      let epoch = 0;

      const trainStep = () => {
        if (epoch >= maxEpochs) {
          setIsTraining(false);
          return;
        }

        weights = trainOneEpoch(data, weights, learningRate);
        
        const loss = calculateLoss(data, weights);
        const accuracy = calculateAccuracy(data, weights);
        
        lossHistory.push({ epoch, loss, accuracy });
        
        setCurrentEpoch(epoch);
        setCurrentLoss(loss);
        setCurrentAccuracy(accuracy);
        setCurrentWeights([...weights]); // Update the displayed weights

                 // Update decision boundary
         updateDecisionBoundary(weights, mainGroup, xScale, yScale, plotWidth, mainPlotHeight);
        
        // Update loss curve
        updateLossCurve(lossHistory, lossGroup, lossXScale, lossYScale);

        epoch++;
        setTimeout(trainStep, trainingSpeed);
      };

      trainStep();
    };

    // Store training function in the SVG element for access from buttons
    (svg.node() as any).trainModel = trainModel;

  }, [learningRate, trainingSpeed, dimensions]);

  const updateDecisionBoundary = (
    weights: [number, number, number],
    group: any,
    xScale: any,
    yScale: any,
    plotWidth: number,
    plotHeight: number
  ) => {
    // Remove previous boundary
    group.selectAll(".decision-boundary").remove();
    group.selectAll(".probability-contour").remove();

    // Add probability heatmap (simplified)
    const gridSize = 20;
    const gridData: Array<{x: number, y: number, probability: number}> = [];
    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const x = (i / gridSize) * 8;
        const y = (j / gridSize) * 8;
        const prob = predict(x, y, weights);
        gridData.push({ x, y, probability: prob });
      }
    }

    group.selectAll(".probability-cell")
      .data(gridData)
      .enter()
      .append("rect")
      .attr("class", "probability-cell")
      .attr("x", (d: {x: number, y: number, probability: number}) => xScale(d.x) - plotWidth / gridSize / 2)
      .attr("y", (d: {x: number, y: number, probability: number}) => yScale(d.y) - plotHeight / gridSize / 2)
      .attr("width", plotWidth / gridSize)
      .attr("height", plotHeight / gridSize)
      .style("fill", (d: {x: number, y: number, probability: number}) => d.probability > 0.5 ? "#ffebee" : "#e3f2fd")
      .style("opacity", (d: {x: number, y: number, probability: number}) => Math.abs(d.probability - 0.5) * 0.3);

    // Draw decision boundary (where probability = 0.5)
    // For 2D: w0 + w1*x + w2*y = 0 => y = -(w0 + w1*x) / w2
    if (Math.abs(weights[2]) > 1e-10) {
      const boundaryPoints = [];
      for (let x = 0; x <= 8; x += 0.1) {
        const y = -(weights[0] + weights[1] * x) / weights[2];
        if (y >= 0 && y <= 8) {
          boundaryPoints.push({ x, y });
        }
      }

      if (boundaryPoints.length > 1) {
        const line = d3.line<{x: number, y: number}>()
          .x(d => xScale(d.x))
          .y(d => yScale(d.y));

        group.append("path")
          .datum(boundaryPoints)
          .attr("class", "decision-boundary")
          .attr("d", line)
          .style("stroke", "#2c3e50")
          .style("stroke-width", 3)
          .style("fill", "none")
          .style("opacity", 0)
          .transition()
          .duration(200)
          .style("opacity", 1);
      }
    }
  };

  const updateLossCurve = (
    history: { epoch: number; loss: number; accuracy: number }[],
    group: any,
    xScale: any,
    yScale: any
  ) => {
    // Remove previous curve
    group.selectAll(".loss-line").remove();
    group.selectAll(".loss-point").remove();

    if (history.length < 2) return;

    // Draw loss curve
    const line = d3.line<{epoch: number, loss: number}>()
      .x(d => xScale(d.epoch))
      .y(d => yScale(d.loss))
      .curve(d3.curveMonotoneX);

    group.append("path")
      .datum(history)
      .attr("class", "loss-line")
      .attr("d", line)
      .style("stroke", "#e74c3c")
      .style("stroke-width", 2)
      .style("fill", "none");

    // Add current point
    const lastPoint = history[history.length - 1];
    group.append("circle")
      .attr("class", "loss-point")
      .attr("cx", xScale(lastPoint.epoch))
      .attr("cy", yScale(lastPoint.loss))
      .attr("r", 4)
      .style("fill", "#e74c3c")
      .style("stroke", "white")
      .style("stroke-width", 2);
  };

  const startTraining = () => {
    if (svgRef.current) {
      const trainFunction = (svgRef.current as any).trainModel;
      if (trainFunction) trainFunction();
    }
  };

  const resetModel = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll(".decision-boundary").remove();
    svg.selectAll(".probability-cell").remove();
    svg.selectAll(".loss-line").remove();
    svg.selectAll(".loss-point").remove();
    setCurrentEpoch(0);
    setCurrentLoss(0);
    setCurrentAccuracy(0);
    setCurrentWeights([0, 0, 0]); // Reset displayed weights
    setIsTraining(false);
  };

  return (
    <div style={{ 
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "20px",
      backgroundColor: "#fff",
      margin: "20px 0"
    }}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{
          textAlign: "center",
          margin: "10px 0 15px 0",
          padding: "12px 20px",
          backgroundColor: "#f8f9fa",
          border: "1px solid #e9ecef",
          borderRadius: "8px",
          fontSize: "16px",
          fontFamily: "Georgia, 'Times New Roman', serif"
        }}>
          <div style={{ 
            color: "#212529",
            fontWeight: "600",
            fontSize: "16px",
            marginBottom: "8px"
          }}>
            ŷ = 1 / (1 + e<sup>-({currentWeights[1].toFixed(3)} × x₁ + {currentWeights[2].toFixed(3)} × x₂ + {currentWeights[0].toFixed(3)})</sup>)
          </div>
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            fontSize: "13px",
            color: "#6c757d",
            fontFamily: "monospace"
          }}>
            <span>w₁ = <strong style={{color: "#0d6efd"}}>{currentWeights[1].toFixed(4)}</strong></span>
            <span>w₂ = <strong style={{color: "#0d6efd"}}>{currentWeights[2].toFixed(4)}</strong></span>
            <span>b = <strong style={{color: "#dc3545"}}>{currentWeights[0].toFixed(4)}</strong></span>
          </div>
        </div>
      </div>
      
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
            disabled={isTraining}
            style={{ width: "120px" }}
          />
          <span style={{ fontSize: "12px", color: "#666", minWidth: "35px" }}>{learningRate.toFixed(2)}</span>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontSize: "14px", fontWeight: "500" }}>Speed:</label>
          <input
            type="range"
            min="50"
            max="500"
            step="50"
            value={trainingSpeed}
            onChange={(e) => setTrainingSpeed(parseInt(e.target.value))}
            disabled={isTraining}
            style={{ width: "120px" }}
          />
          <span style={{ fontSize: "12px", color: "#666", minWidth: "50px" }}>{trainingSpeed}ms</span>
        </div>
        
        <button
          onClick={startTraining}
          disabled={isTraining}
          style={{
            fontSize: "14px",
            border: "1px solid #27ae60",
            borderRadius: "4px",
            backgroundColor: isTraining ? "#95a5a6" : "#27ae60",
            color: "white",
            cursor: isTraining ? "not-allowed" : "pointer",
            margin: "0 0 0 0"
          }}
          data-umami-event="LR Training Demo"
        >
          {isTraining ? "Training..." : "Start Training"}
        </button>
        
        <button
          onClick={resetModel}
          disabled={isTraining}
          style={{
            fontSize: "14px",
            border: "1px solid #e74c3c",
            borderRadius: "4px",
            backgroundColor: isTraining ? "#95a5a6" : "#e74c3c",
            color: "white",
            cursor: isTraining ? "not-allowed" : "pointer"
          }}
        >
          Reset
        </button>
      </div>

      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        gap: "30px", 
        marginBottom: "15px",
        fontSize: "14px",
        fontWeight: "500"
      }}>
        <div>Epoch: <span style={{ color: "#2c3e50" }}>{currentEpoch+1}</span></div>
        <div>Loss: <span style={{ color: "#e74c3c" }}>{currentLoss.toFixed(4)}</span></div>
        <div>Accuracy: <span style={{ color: "#27ae60" }}>{(currentAccuracy * 100).toFixed(1)}%</span></div>
      </div>
      
      <div ref={containerRef} style={{ textAlign: "center", overflow: "hidden", width: "100%" }}>
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          style={{ 
            maxWidth: "100%", 
            height: "auto",
            display: "block"
          }}
        />
      </div>
      
      <div style={{ 
        display: "flex", 
        justifyContent: "space-around", 
        fontSize: "13px",
        color: "#666"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#3498db", fontWeight: "bold", marginBottom: "5px" }}>
            🔵 Class 0
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#e74c3c", fontWeight: "bold", marginBottom: "5px" }}>
            🔴 Class 1  
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#2c3e50", fontWeight: "bold", marginBottom: "5px" }}>
            ━ Decision Boundary
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogisticRegressionLearning; 