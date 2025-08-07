import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const RegularizationViz: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [weights, setWeights] = useState([0.5, -0.3, 1.2, -0.8, 0.9]);
  const [lambda, setLambda] = useState(0.1);
  const [regularizationType, setRegularizationType] = useState<'L1' | 'L2'>('L2');

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 20, bottom: 120, left: 60 };
    const width = 700; // Match article text width
    const height = 560; // More height for summary box
    const plotWidth = (width - margin.left - margin.right - 80) / 2; // More horizontal gap
    const plotHeight = height - margin.bottom - margin.top;

    // Calculate penalties for each weight based on regularization type
    const penalties = weights.map(w => 
      regularizationType === 'L2' ? lambda * w * w : lambda * Math.abs(w)
    );
    const totalPenalty = penalties.reduce((sum, penalty) => sum + penalty, 0);

    // Create scales for weights plot
    const xScaleWeights = d3.scaleBand()
      .domain(weights.map((_, i) => `w${i + 1}`))
      .range([0, plotWidth])
      .padding(0.2);

    const maxAbsWeight = Math.max(...weights.map(Math.abs), 2);
    const yScaleWeights = d3.scaleLinear()
      .domain([-maxAbsWeight, maxAbsWeight])
      .range([plotHeight, 0]);

    // Create scales for penalties plot
    const xScalePenalties = d3.scaleBand()
      .domain(weights.map((_, i) => `w${i + 1}`))
      .range([0, plotWidth])
      .padding(0.2);

    const maxPenalty = Math.max(...penalties, regularizationType === 'L2' ? lambda * 4 : lambda * 2); // Include max possible penalty
    const yScalePenalties = d3.scaleLinear()
      .domain([0, maxPenalty])
      .range([plotHeight, 0]);

    // Create weights plot
    const weightsG = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add axes for weights plot
    weightsG.append("g")
      .attr("transform", `translate(0,${plotHeight})`)
      .call(d3.axisBottom(xScaleWeights));

    weightsG.append("g")
      .call(d3.axisLeft(yScaleWeights));

    // Add zero line for weights
    weightsG.append("line")
      .attr("x1", 0)
      .attr("x2", plotWidth)
      .attr("y1", yScaleWeights(0))
      .attr("y2", yScaleWeights(0))
      .attr("stroke", "#666")
      .attr("stroke-dasharray", "3,3")
      .attr("opacity", 0.7);

    // Draw weight bars with hover interactions
    weightsG.selectAll(".weight-bar")
      .data(weights)
      .enter().append("rect")
      .attr("class", "weight-bar")
      .attr("data-weight-index", (d, i) => i)
      .attr("x", (d, i) => xScaleWeights(`w${i + 1}`)!)
      .attr("y", d => d >= 0 ? yScaleWeights(d) : yScaleWeights(0))
      .attr("width", xScaleWeights.bandwidth())
      .attr("height", d => Math.abs(yScaleWeights(d) - yScaleWeights(0)))
      .attr("fill", d => d >= 0 ? "#3498db" : "#e74c3c")
      .attr("opacity", 0.8)
      .style("cursor", "pointer")
      .on("mouseenter", function(event, d) {
        const index = d3.select(this).attr("data-weight-index");
        
        // Gently fade out all other weight bars
        svg.selectAll(".weight-bar")
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .attr("opacity", 0.4);
        
        // Gently fade out all other penalty bars
        svg.selectAll(".penalty-bar")
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .attr("opacity", 0.4);
        
        // Gently fade out all labels
        svg.selectAll(".weight-label, .penalty-label")
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .style("opacity", 0.5);
        
        // Gently highlight the connected pair
        d3.select(this)
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .attr("opacity", 0.95)
          .attr("stroke", "#34495e")
          .attr("stroke-width", 1.5);
        
        svg.select(`.penalty-bar[data-penalty-index="${index}"]`)
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .attr("opacity", 0.95)
          .attr("stroke", "#34495e")
          .attr("stroke-width", 1.5);
        
        // Gently highlight corresponding labels
        svg.select(`.weight-label[data-weight-index="${index}"]`)
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .style("opacity", 1)
          .style("font-weight", "bold")
          .style("fill", "#34495e");
        
        svg.select(`.penalty-label[data-penalty-index="${index}"]`)
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .style("opacity", 1)
          .style("font-weight", "bold")
          .style("fill", "#34495e");
      })
      .on("mouseleave", function(event, d) {
        // Gently restore all elements
        svg.selectAll(".weight-bar")
          .transition()
          .duration(400)
          .ease(d3.easeCubicOut)
          .attr("opacity", 0.8)
          .attr("stroke", "none");
        
        svg.selectAll(".penalty-bar")
          .transition()
          .duration(400)
          .ease(d3.easeCubicOut)
          .attr("opacity", 0.8)
          .attr("stroke", "none");
        
        svg.selectAll(".weight-label")
          .transition()
          .duration(400)
          .ease(d3.easeCubicOut)
          .style("opacity", 1)
          .style("font-weight", "bold")
          .style("fill", "#333");
        
        svg.selectAll(".penalty-label")
          .transition()
          .duration(400)
          .ease(d3.easeCubicOut)
          .style("opacity", 1)
          .style("font-weight", "bold")
          .style("fill", "#f39c12");
      });

    // Add weight value labels
    weightsG.selectAll(".weight-label")
      .data(weights)
      .enter().append("text")
      .attr("class", "weight-label")
      .attr("data-weight-index", (d, i) => i)
      .attr("x", (d, i) => xScaleWeights(`w${i + 1}`)! + xScaleWeights.bandwidth() / 2)
      .attr("y", d => d >= 0 ? yScaleWeights(d) - 5 : yScaleWeights(0) + 15)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .text(d => d.toFixed(2));

    // Add title for weights plot
    weightsG.append("text")
      .attr("x", plotWidth / 2)
      .attr("y", -30)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Weight Values");

    // Add y-axis label for weights
    weightsG.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (plotHeight / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Weight Value");

    // Create penalties plot
    const penaltiesG = svg.append("g")
      .attr("transform", `translate(${margin.left + plotWidth + 80},${margin.top})`);

    // Add axes for penalties plot
    penaltiesG.append("g")
      .attr("transform", `translate(0,${plotHeight})`)
      .call(d3.axisBottom(xScalePenalties));

    penaltiesG.append("g")
      .call(d3.axisLeft(yScalePenalties).tickFormat(d3.format(".3f")));

    // Draw penalty bars with hover interactions
    penaltiesG.selectAll(".penalty-bar")
      .data(penalties)
      .enter().append("rect")
      .attr("class", "penalty-bar")
      .attr("data-penalty-index", (d, i) => i)
      .attr("x", (d, i) => xScalePenalties(`w${i + 1}`)!)
      .attr("y", d => yScalePenalties(d))
      .attr("width", xScalePenalties.bandwidth())
      .attr("height", d => plotHeight - yScalePenalties(d))
      .attr("fill", "#f39c12")
      .attr("opacity", 0.8)
      .style("cursor", "pointer")
      .on("mouseenter", function(event, d) {
        const index = d3.select(this).attr("data-penalty-index");
        
        // Gently fade out all other weight bars
        svg.selectAll(".weight-bar")
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .attr("opacity", 0.4);
        
        // Gently fade out all other penalty bars
        svg.selectAll(".penalty-bar")
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .attr("opacity", 0.4);
        
        // Gently fade out all labels
        svg.selectAll(".weight-label, .penalty-label")
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .style("opacity", 0.5);
        
        // Gently highlight the connected pair
        d3.select(this)
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .attr("opacity", 0.95)
          .attr("stroke", "#34495e")
          .attr("stroke-width", 1.5);
        
        svg.select(`.weight-bar[data-weight-index="${index}"]`)
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .attr("opacity", 0.95)
          .attr("stroke", "#34495e")
          .attr("stroke-width", 1.5);
        
        // Gently highlight corresponding labels
        svg.select(`.penalty-label[data-penalty-index="${index}"]`)
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .style("opacity", 1)
          .style("font-weight", "bold")
          .style("fill", "#34495e");
        
        svg.select(`.weight-label[data-weight-index="${index}"]`)
          .transition()
          .duration(300)
          .ease(d3.easeCubicOut)
          .style("opacity", 1)
          .style("font-weight", "bold")
          .style("fill", "#34495e");
      })
      .on("mouseleave", function(event, d) {
        // Gently restore all elements
        svg.selectAll(".weight-bar")
          .transition()
          .duration(400)
          .ease(d3.easeCubicOut)
          .attr("opacity", 0.8)
          .attr("stroke", "none");
        
        svg.selectAll(".penalty-bar")
          .transition()
          .duration(400)
          .ease(d3.easeCubicOut)
          .attr("opacity", 0.8)
          .attr("stroke", "none");
        
        svg.selectAll(".weight-label")
          .transition()
          .duration(400)
          .ease(d3.easeCubicOut)
          .style("opacity", 1)
          .style("font-weight", "bold")
          .style("fill", "#333");
        
        svg.selectAll(".penalty-label")
          .transition()
          .duration(400)
          .ease(d3.easeCubicOut)
          .style("opacity", 1)
          .style("font-weight", "bold")
          .style("fill", "#f39c12");
      });

    // Add penalty value labels
    penaltiesG.selectAll(".penalty-label")
      .data(penalties)
      .enter().append("text")
      .attr("class", "penalty-label")
      .attr("data-penalty-index", (d, i) => i)
      .attr("x", (d, i) => xScalePenalties(`w${i + 1}`)! + xScalePenalties.bandwidth() / 2)
      .attr("y", d => yScalePenalties(d) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .style("fill", "#f39c12")
      .text(d => d.toFixed(4));

    // Add title for penalties plot
    penaltiesG.append("text")
      .attr("x", plotWidth / 2)
      .attr("y", -30)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text(`${regularizationType} Penalties (λ${regularizationType === 'L2' ? 'w²' : '|w|'})`);

    // Add y-axis label for penalties
    penaltiesG.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (plotHeight / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Penalty Value");

    // Add combined legend at bottom with more clearance
    const legend = svg.append("g")
      .attr("transform", `translate(${width / 2 - 180}, ${height - 80})`);

    // Positive weights
    legend.append("rect")
      .attr("x", 0).attr("y", 0)
      .attr("width", 12).attr("height", 12)
      .attr("fill", "#3498db")
      .attr("opacity", 0.8);

    legend.append("text")
      .attr("x", 18)
      .attr("y", 10)
      .style("font-size", "11px")
      .text("Positive Weights");

    // Negative weights
    legend.append("rect")
      .attr("x", 120).attr("y", 0)
      .attr("width", 12).attr("height", 12)
      .attr("fill", "#e74c3c")
      .attr("opacity", 0.8);

    legend.append("text")
      .attr("x", 138)
      .attr("y", 10)
      .style("font-size", "11px")
      .text("Negative Weights");

    // L2 penalties
    legend.append("rect")
      .attr("x", 240).attr("y", 0)
      .attr("width", 12).attr("height", 12)
      .attr("fill", "#f39c12")
      .attr("opacity", 0.8);

    legend.append("text")
      .attr("x", 258)
      .attr("y", 10)
      .style("font-size", "11px")
      .text(`${regularizationType} Penalties`);

    // Add total penalty display below legend - make it stand out with more padding
    const penaltyDisplay = svg.append("g")
      .attr("transform", `translate(${width / 2 - 200}, ${height - 45})`);

    penaltyDisplay.append("rect")
      .attr("width", 400)
      .attr("height", 50)
      .attr("fill", "#fff3cd")
      .attr("stroke", "#ffc107")
      .attr("stroke-width", 2)
      .attr("rx", 8)
      .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.15))");

    penaltyDisplay.append("text")
      .attr("x", 200)
      .attr("y", 20)
      .style("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .style("fill", "#856404")
      .text("REGULARIZATION SUMMARY");

    penaltyDisplay.append("text")
      .attr("x", 200)
      .attr("y", 38)
      .style("text-anchor", "middle")
      .style("font-size", "13px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .text(`λ = ${lambda.toFixed(2)} | Total ${regularizationType} Penalty = ${totalPenalty.toFixed(4)} (= λ Σ ${regularizationType === 'L2' ? 'w²' : '|w|'})`);

  }, [weights, lambda, regularizationType]);

  const handleWeightChange = (index: number, value: number) => {
    const newWeights = [...weights];
    newWeights[index] = value;
    setWeights(newWeights);
  };

  return (
    <div className="regularization-viz" style={{ textAlign: 'center', margin: '20px 0' }}>      
      {/* Compact control panel */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '15px', 
        marginBottom: '25px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        {/* Top row: Type and Lambda */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '30px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong>Type:</strong>
            <select
              value={regularizationType}
              onChange={(e) => setRegularizationType(e.target.value as 'L1' | 'L2')}
              style={{ 
                padding: '6px 10px', 
                fontSize: '14px', 
                borderRadius: '4px',
                border: '1px solid #ccc',
                backgroundColor: 'white'
              }}
            >
              <option value="L1">L1 (Lasso)</option>
              <option value="L2">L2 (Ridge)</option>
            </select>
            <span style={{ 
              fontSize: '13px', 
              color: '#666',
              fontStyle: 'italic'
            }}>
              λ{regularizationType === 'L2' ? 'w²' : '|w|'}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong>λ:</strong>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={lambda}
              onChange={(e) => setLambda(parseFloat(e.target.value))}
              style={{ width: '120px' }}
            />
            <span style={{ 
              fontWeight: 'bold', 
              minWidth: '35px',
              fontSize: '14px'
            }}>
              {lambda.toFixed(2)}
            </span>
          </div>
        </div>
        
        {/* Bottom row: Weight sliders */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '15px', 
          flexWrap: 'wrap'
        }}>
          {weights.map((weight, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              minWidth: '80px'
            }}>
              <label style={{ 
                fontSize: '12px', 
                fontWeight: 'bold',
                marginBottom: '3px',
                color: '#495057'
              }}>
                w{index + 1}
              </label>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={weight}
                onChange={(e) => handleWeightChange(index, parseFloat(e.target.value))}
                style={{ width: '70px' }}
              />
              <span style={{ 
                fontSize: '11px', 
                marginTop: '3px',
                fontWeight: '500'
              }}>
                {weight.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <svg ref={svgRef} width={700} height={580}></svg>
      
      
    </div>
  );
};

export default RegularizationViz; 