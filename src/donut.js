import React, { useEffect, useState } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import { Flex, Text } from '@looker/components'
import styled from 'styled-components'
import { find } from 'lodash'

const MARGIN = {
  'small': 10,
  'medium': 15,
  'large': 20
}



const OPTIONS = {
  chart: {
    type: "pie",
    borderColor: 'blue',
    backgroundColor: 'transparent'
  },
  title: null,
  tooltip: {
    pointFormat: `<b>{point.name}</b><br/>{point.percentage:.1f}%<br/>{point.rendered_y}`
  },
  plotOptions: {
    pie: {
      allowPointSelect: true,
      cursor: 'pointer',
      dataLabels: {
        enabled: true,
        distance: '-15%',
      }
    }
  },
  credits: {
    enabled: false
  }, 
}
export const App = (props) => {
  const {data, dimensions, text_size, measures, height, width, config, labels, chart_num} = props

  const { field_value_color, no_value_color } = config


  const [options, setOptions] = useState(OPTIONS)
  const pickColor = (chart_num, dt) => {
    const value = dt[dimensions[0].name].value
    const measure = dt[measures[0].name].value
    if (measure === 0) {
      return no_value_color
    }
    if (value && value.length) {
      const found = find(field_value_color, {value})
      if (found) {
        return found.color
      }
    }
    return pieColors[chart_num]
  }
  var pieColors = (function () {
    var colors = [],
        base = config.color_range || ["#FFBA00", "#F56F02", "#CB1F47", "#645DAC", "#0088D2", "#00B345"],
        num_dim = 5,
        i;

    for (i = 0; i < num_dim; i += 1) {
      base.forEach(c=>{
        if (i===0) {
          colors.push(Highcharts.color(c).get())
        } else {
          colors.push(Highcharts.color(c).brighten(i / num_dim).get());
        }
      })
    }
    return colors;
  }());

  var brightenColor = (color) => {
    const new_color = Highcharts.color(color).setOpacity(0.3).get()
    return new_color
  }

  useEffect(()=>{
    let point_format = []
    if (labels.show_measure) point_format.push("<b>{point.name}</b>")
    if (labels.show_percent) point_format.push(`{point.percentage:.${config.percentage_decimal_points}f}%`)
    if (labels.show_value) point_format.push("{point.rendered_y}")
    
    setOptions({
      ...OPTIONS,
      plotOptions: {
        ...OPTIONS.plotOptions,
        pie: {
          ...OPTIONS.plotOptions.pie,
          size: height - 100 - MARGIN[text_size],
          dataLabels: {
            padding: 0,
            enabled: (point_format.length ),
            format: (data[measures[0].name].value!==0) ? point_format.join('<br/>') : ''
          }
        }
      },
      title: {
        text: (labels.show_percent_center) ? 
        textData(data, measures, text_size, config.percentage_decimal_points) :
          '',
        align: 'center',
        verticalAlign: 'middle',
        style: {color: config.font_color}
      },
      tooltip: {
        pointFormat: `<b>{point.name}</b><br/>{point.percentage:.${config.percentage_decimal_points}f}%<br/>{point.rendered_y}`
      },
      chart: {
        ...OPTIONS.chart,
        height: height - 100,
        width,
        style: {
          color: config.font_color
        }
      },
      series: {
        name: '',
        innerSize: (config.inner_radius) ? `${config.inner_radius}%` : '50%',
        events: {
          click: function(event) {
            if (event.point.links.length === 1 && window.parent.parent) {
              LookerCharts.Utils.openDrillMenu({
                links: event.point.links,
                event: event
              });
              // console.log(event.point.links[0])
              // LookerCharts.Utils.openUrl(event.point.links[0].url, event, true, {})
              // // window.parent.parent.postMessage({help: 123})
            } else {
              LookerCharts.Utils.openDrillMenu({
                links: event.point.links,
                event: event
              });
            }
            
          },
        },  
        dataLabels: {
          enabled: true,
          color: config.font_color
        },    
        data: [measures[0], measures[2]].map((m,j)=>{
          return {
            name: m.label_short || m.label,
            y: data[m.name].value || 0,
            rendered_y: data[m.name].rendered || `${data[m.name].value}` || `0`,
            links: data[m.name].links || [],
            color: (j===0) ? pickColor(chart_num,data) : `${brightenColor(pickColor(chart_num,data))}`
          }
        })
      }
    })
  },[props])
  const __html = `${LookerCharts.Utils.htmlForCell(data[dimensions[0].name])}${(config.show_values) ? "<br/>" + `${data[measures[0].name].rendered || data[measures[0].name].value} / ${data[measures[1].name].rendered || data[measures[1].name].value}`: "" }`
  return <Flex 
      flexDirection="column" 
      textAlign="center"
      position="relative"
    >
      <FloatingText 
        fontSize={text_size || "small"}
        font_color={pickColor(chart_num,data)}
        lineHeight="small"
        onClick={(event)=>{
          LookerCharts.Utils.openDrillMenu({
            links: data[measures[0].name].links,
            event: event
          });
        }}
        dangerouslySetInnerHTML={{__html}}
      />
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        allowChartUpdate={true}
      />
    </Flex>
}

const FloatingText = styled(Text)`
  color: ${props=>props.font_color};
  width: 100%;
  top: 0;
  left: 0;
  z-index: 10;
}
`

const textData = (data, measures, text_size, percentage_decimal_points) => {
  const val1 = data[measures[0].name].value;
  const total = data[measures[1].name].value; 
  const percent = val1/total;
  const size = (text_size==='large') ? '1.125rem' : (text_size==='medium') ? '1rem' : '0.875rem'
  const style = `font-size: ${size};`
  if (!total || total === 0) {
    return `<h2 style="${style}">0%</h2>`; 
  } else {
    return `<h2 style="${style}">${percent.toLocaleString(undefined,{ style: 'percent', minimumFractionDigits: percentage_decimal_points })}</h2>`; 
  }
}