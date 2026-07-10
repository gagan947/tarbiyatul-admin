$(document).ready(function () {

  // ── Sidebar Toggles ──
  $(".ct_menu_bar").click(function () {
    $("main").addClass("ct_show");
  });

  $(".ct_close_sidebar").click(function () {
    $("main").removeClass("ct_show");
  });

});

var options = {
    series: [{
        name: "Fees Collection",
        data: [0, 900, 500, 4200, 2400, 5700, 5100, 5400, 1200, 4800, 6900, 5200]
    }],

    chart: {
        type: "area",
        height: 228,
        toolbar: {
            show: false
        },
        zoom: {
            enabled: false
        }
    },

    stroke: {
        curve: "smooth",
        width: 3,
        colors: ["#F4C542"]
    },

    fill: {
        type: "gradient",
        gradient: {
            shadeIntensity: 0,
            opacityFrom: 0.45,
            opacityTo: 0,
            stops: [0, 100]
        },
        colors: ["#F4C542"]
    },

    markers: {
        size: [0,0,0,0,0,0,0,6,0,0,0,0],
        colors: ["#F4C542"],
        strokeColors: "#fff",
        strokeWidth: 3,
        hover: {
            size: 7
        }
    },

    dataLabels: {
        enabled: false
    },

    grid: {
        borderColor: "#efefef",
        strokeDashArray: 0
    },

    xaxis: {
        categories: [
            "Jan","Feb","Mar","Apr","May","Jun",
            "Jul","Aug","Sep","Oct","Nov","Dec"
        ],
        axisBorder: {
            show: false
        },
        axisTicks: {
            show: false
        }
    },

    yaxis: {
        min: 0,
        max: 7500,
        tickAmount: 3,
        labels: {
            formatter: function(val){
                return val.toLocaleString();
            }
        }
    },

    tooltip: {
        shared: false,
        intersect: true,
        marker: {
            show: false
        },
        y: {
            formatter: function(val){
                return "$" + val.toLocaleString();
            }
        }
    },

    annotations: {
        xaxis: [{
            x: "Aug",
            borderColor: "#F4C542",
            strokeDashArray: 0,
            label: {
                borderColor: "#F4C542",
                style: {
                    background: "#fff",
                    color: "#555"
                },
                text: "$152,927"
            }
        }]
    },

    colors: ["#F4C542"],

    legend: {
        show: false
    },

   
   
};

var chart = new ApexCharts(document.querySelector("#feesChart"), options);
chart.render();