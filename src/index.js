import { App } from './donut'
import React from 'react'
import ReactDOM from 'react-dom'
import uniq from 'lodash/uniq'
// import { Donut } from './donut';
import { ComponentsProvider, Grid } from '@looker/components';
import { filter } from 'lodash';
import styled from 'styled-components';

looker.plugins.visualizations.add({
  id: "react_test",
  label: "React Test",
  options: {
    color_range: {
      type: "array",
      label: "Color Range",
      display: "colors",
      default: ["#FFBA00", "#F56F02", "#CB1F47", "#645DAC", "#0088D2", "#00B345"],
      order: 1,
      display_size: "half",
    },
    inner_radius: {
      type: "number",
      label: "Inner Radius",
      min: 0,
      max: 100,
      default: 50,
      order: 3,
      display_size: "half",
    },
    num_columns: {
      type: "number",
      label: "Columns",
      min: 1,
      default: 4,
      display_size: "half",
      order: 5
    },
    num_rows: {
      type: "number",
      label: "Rows",
      min: 1,
      default: 4,
      display_size: "half",
      order: 4
    },
    text_size: {
      type: "string",
      label: "Label Size",
      display: "select",
      values: [
      	 {"Small": "small"},
      	 {"Medium": "medium"},
      	 {"Large": "large"}
      ],
      default: "medium",
      order: 6
    },
    show_measure: {
      type: "boolean",
      display: "radio",
      display_size: "half",
      label: "Measure Label",
      default: true,
      order: 10
    },
    show_percent: {
      type: "boolean",
      display: "radio",
      display_size: "half",
      label: "Percent Label",
      default: true,
      order: 11
    },
    show_value: {
      type: "boolean",
      display: "radio",
      display_size: "half",
      label: "Value Label",
      default: true,
      order: 12
    },
    show_percent_center: {
      type: "boolean",
      display: "radio",
      display_size: "half",
      label: "Percent Center",
      default: true,
      order: 13
    },
    show_values: {
      type: "boolean",
      display: "radio",
      display_size: "half",
      label: "Show Values",
      default: true,
      order: 14
    },
  },
  // Set up the initial state of the visualization
  create: function(element, config) {

    // Insert a <style> tag with some styles we'll use later.
    element.innerHTML = `
      <style>
        #vis {
          /* Vertical centering */
          height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
          margin: 0;
        }
      </style>
    `;

    const vis = document.getElementById('vis')
    this._vis = vis
    

    // Render to the target element
    this.chart = ReactDOM.render(
      <></>,
      this._vis
    );

  },
  // Render in response to the data or settings changing
  updateAsync: function(data, element, config, queryResponse, details, done) {
    
    // Clear any errors from previous updates
    this.clearErrors();

    if (queryResponse.fields.dimension_like.length !== 1) {
      this.addError({title: "One Dimension", message: "This chart requires one dimension."});
      return;
    }
    if (queryResponse.fields.measure_like.length !== 3) {
      this.addError({title: "Three Measures", message: "This chart requires three measures; Value, Target, Remaining in that order."});
      return;
    }
    const dim_name = queryResponse.fields.dimension_like[0].name;
    const meas_name = queryResponse.fields.measure_like[0].name;

    if (uniq(data.map(r=>r[dim_name].value)).length !== data.length) {
      this.addError({title: "Non-unique Dimension Values", message: "This chart has repeated values in the dimension, possibly caused by hiding a field"});
      return;
    }

    let new_config = {...config}
    if (!config.inner_radius) { new_config['inner_radius'] = 50 }
    if (!config.color_range) { new_config['color_range'] = ["#FFBA00", "#F56F02", "#CB1F47", "#645DAC", "#0088D2", "#00B345"] }
    
    // Finally update the state with our new data
    const total_object = (
      queryResponse && 
      queryResponse.totals_data && 
      queryResponse.totals_data[meas_name] && 
      queryResponse.totals_data[meas_name].html  
    ) ? queryResponse.totals_data[meas_name].html : '<a></a>'
    
    var doc = new DOMParser().parseFromString(total_object, "text/html");
    const doc_a = doc.getElementsByTagName('a')[0]
    const doc_b = doc.getElementsByTagName('body')[0]
    const totals_data = (doc_a)? doc_a.innerHTML: doc_b.innerHTML
    const columns = config.num_columns;
    const rows = config.num_rows;
    const sliced_data = data.slice(0,rows*columns);
    const {show_measure, show_value, show_percent, show_percent_center} = config
    const labels = {show_measure, show_value, show_percent, show_percent_center} 
    console.log({gridHeight: element.offsetHeight/rows, elementHeight: element.offsetHeight})
    this.chart = ReactDOM.render(
      <ComponentsProvider>
        <StyledGrid columns={columns}>
          {sliced_data.map((d,i)=>{
            return <App 
              text_size={config.text_size}
              labels={labels}
              data={d}
              totals_data={totals_data }
              config={new_config}
              height={element.offsetHeight/rows}
              width={element.offsetWidth/columns}
              measures={queryResponse.fields.measure_like}
              dimensions={queryResponse.fields.dimension_like}
              key={`ring::${i}`}
              chart_num={i}
            />
          })}
        </StyledGrid>
      </ComponentsProvider>,
      this._vis
    );

    // We are done rendering! Let Looker know.
    done();
  }
});
const StyledGrid = styled(Grid)`grid-gap: 0px`