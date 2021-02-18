import React, { useEffect, useState } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

const OPTIONS = {
  chart: {
    type: "pie",
  },
  title: null,
  tooltip: {
    pointFormat: '<b>{point.name}</b><br/>{point.percentage:.1f}%<br/>{point.rendered_y}'
  },
  plotOptions: {
    pie: {
      allowPointSelect: true,
      cursor: 'pointer',
      dataLabels: {
        enabled: true,
        format: '<b>{point.name}</b>: {point.percentage:.1f}% ({point.rendered_y})'
      }
    }
  },
  credits: {
    enabled: false
  }, 
}
export const App = (props) => {
  const {data, dim_name, meas_name, height, width, config, totals_data} = props
  

  const [options, setOptions] = useState(OPTIONS)
  var pieColors = (function () {
    var colors = [],
        base = config.color_range || ["#FFBA00", "#F56F02", "#CB1F47", "#645DAC", "#0088D2", "#00B345"],
        num_dim = 5,
        i;

    for (i = 0; i < num_dim; i += 1) {
      base.forEach(c=>{
        if (i===0) {
          colors.push(c)
        } else {
          colors.push(Highcharts.color(c).brighten(i / num_dim).get());
        }
      })
    }
    return colors;
  }());

  useEffect(()=>{
    setOptions({
      ...OPTIONS,
      plotOptions: {
        ...OPTIONS.plotOptions,
        pie: {
          ...OPTIONS.plotOptions.pie,
          colors: pieColors
        }
      },
      title: {
        text: (config.show_total)?totals_data:'',
        align: 'center',
        verticalAlign: 'middle',
      },
      chart: {
        ...OPTIONS.chart,
        height,
        width,
      },
      series: {
        name: '',
        innerSize: (config.inner_radius) ? `${config.inner_radius}%` : '50%',
        events: {
          click: function(event) {
            LookerCharts.Utils.openDrillMenu({
              links: event.point.links,
              event: event
            });
          },
        },      
        data: data.map(r=>{
          let links = []
          
          if (r[dim_name].links && r[dim_name].links.length) { links = links.concat(r[dim_name].links) }
          if (r[meas_name].links && r[meas_name].links.length) { links = links.concat(r[meas_name].links) }
          return {
            name: r[dim_name].rendered || r[dim_name].value || r.dim_name,
            y: r[meas_name].value || r.meas_name || 0,
            rendered_y: r[meas_name].rendered || r[meas_name].value || r.meas_name,
            links
          }
        })
      }
    })
  },[props])
  console.log(options)
  return <HighchartsReact
      highcharts={Highcharts}
      options={options}
      allowChartUpdate={true}
    />
}