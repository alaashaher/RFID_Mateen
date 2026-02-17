import React, { useEffect, useState } from 'react'
import Chart from 'react-apexcharts'


import './StatisticsPage.scss'
import { getFromApi } from '../../apis/apis'
const PieChart = () => {

    const [totalData, settotalData] = useState([])
      useEffect(() => {
        const fetchLanguages = async () => {
          try {
            const res = await getFromApi(`UniversityAsset/get-assets-groupedby-status`);
            settotalData(res);
          } catch (error) {
            //console.log(error);
          }
        };
        fetchLanguages();
      }, []);
    const renderCharts = (chartData) => {


        let state = {
            options: {
                chart: {
                    id: "basic-bar"
                },
                xaxis: {
                    categories: totalData.map((item)=> item.AssetStatus) 
                }
            },
            series: [
                {
                    name: "series-1",
                    data:  totalData.map((item)=> item.Count)
                }
            ]
        };




        return (
            <div className='single-chart'>
                <p>حالات الاصول</p>

                <Chart options={state?.options} series={state?.series} type="bar" width={500} />
            </div>

        )
    }

    // const renderCharts3 = (chartData) => {
    //     let state = {
    //         series: chartData.map((item) => item.Count),
    //         options: {
    //             chart: {
    //                 width: 800, // doubled width to make the pie chart twice as large
    //                 type: 'pie',
    //             },
    //             legend: {
    //                 position: 'bottom'
    //             },
    //             colors: ['#4e0504', '#75aef8', '#581312', '#57105b', '#16565b','#b84644', '#4576b5', '#ff0a06', '#af45b5', '#44b0b8', '#1f3c63', '#902a10', '#A5978B', '#281e16', '#688e75', '#413f3e', '#b63c2f', '#353231', '#482c29', '#2f63b6', '#8D5B4C', '#5A2A27', '#17c16f', '#6a0e56', '#1080c6', '#082536', '#71c610', , '#2e10c6', '#10c67a'],
    //             labels: chartData.map((item) => item.TempOrderStatusName ? item.TempOrderStatusName : ""),
    //             responsive: [{
    //                 breakpoint: 480,
    //                 options: {
    //                     chart: {
    //                         width: 400 // adjust for smaller screens if necessary
    //                     },
    //                     legend: {
    //                         position: 'bottom'
    //                     }
    //                 }
    //             }]
    //         },
    //     };

    //     console.log("state, state2", state);

    //     return (

    //         <div className='single-chart'>
    //             <p>  جميع الطلبات العملاء المؤقتين</p>
    //             <Chart options={state.options} series={state.series} type="bar" width={750} />
    //         </div>
    //     )
    // }
    return (
        <>
            <div className=''>
                {totalData?.length > 0 && renderCharts(totalData)}
                {/* {temporderslData && renderCharts3(temporderslData)} */}
            </div >
        </>
    )
}

export default PieChart
