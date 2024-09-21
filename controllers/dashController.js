const trade = require('wstrade-api');
const { Chart } = require('chart.js')
const chartAnnotations = require('chartjs-plugin-annotation')
const url = require('url')
let tradeAccounts
let holdings
let recentAccountHistory
let focusedAccount

const update_stock_get = async(req, res) => {
    const ticker = req.params.ticker
    const range = req.params.range
    const exchange = req.params.exchange

    stockHistory = await get_stock_history(ticker, exchange, range)
        //Graph Stuff
    const config = await init_stock_chart(stockHistory)
        ///////////End Graph Stuff

    context = {
        graphConfig: config,
    }

    res.json(context)
}

const stock_page_get = async(req, res) => {
    var requestedStockData
    var stock_history
    if (typeof holdings === 'undefined') {
        holdings = await trade.accounts.positions(focusedAccount)
    }
    ticker = req.params.ticker
    exchange = req.params.exchange
    for (let i = 0; i < holdings.length; i++) {
        const holding = holdings[i];
        if (holding.stock.symbol === ticker) {
            requestedStockData = holding;
            break;
        }
    }
    await get_stock_history(ticker, exchange, '1d')
        .then(result => {
            stock_history = result
        })
        .catch(err => {
            console.log("This is the error: ", err)
        })
    var graphConfig = await init_stock_chart(stock_history)
        //console.log(holdings)
        //console.log(requestedStockData)
        //console.log(ticker)
    context = {
        title: ticker,
        ticker: ticker,
        requestedStockData: requestedStockData,
        recentAccountHistory: recentAccountHistory,
        graphConfig: JSON.stringify(graphConfig),

    }
    res.render('stockpage', context)
}

const update_dash_get = async(req, res) => {
    const range = req.params.range
    console.log(range)

    accountHistory = await get_account_history(focusedAccount, range)
    recentAccountHistory = accountHistory.most_recent
    fullAccountHistory = accountHistory.account_history
        //Graph Stuff
    const config = await init_account_chart(fullAccountHistory)
        ///////////End Graph Stuff

    context = {
        recentAccountHistory: recentAccountHistory,
        graphConfig: config,
    }

    res.json(context)
}

const get_account_name = (account) => {
    var name
    if (account.includes('crypto')) {
        name = 'Crypto'
    } else if (account.includes('tfsa')) {
        name = 'TFSA'
    } else if (account.includes('rrsp')) {
        name = 'RRSP'
    } else {
        name = 'Personal'
    }
    return name
}

const dashboard_get_context = async(account = null) => {
    console.log(tradeAccounts)
    console.log("Currently Viewing: ", focusedAccount)
    holdings = await trade.accounts.positions(focusedAccount)
    accountHistory = await get_account_history(focusedAccount, '1d')
    recentAccountHistory = accountHistory.most_recent
    fullAccountHistory = accountHistory.account_history
        //Graph Stuff
    const config = await init_account_chart(fullAccountHistory)
        ///////////End Graph Stuff

        console.log(get_account_name(focusedAccount))
    context = {
        tradeAccounts: tradeAccounts,
        title: "Dashboard",
        currentAccount: get_account_name(focusedAccount),
        holdings: holdings,
        recentAccountHistory: recentAccountHistory,
        graphConfig: JSON.stringify(config),
        stringedHoldings: JSON.stringify(holdings),
    }

    return context
}

const dashboard_get = async(req, res) => {
    const queryObject = url.parse(req.url, true).query
    const account = queryObject.account
    tradeAccounts = await trade.accounts.all();
    focusedAccount = account != null ? tradeAccounts[account.toLowerCase()] : tradeAccounts.personal
    if (account && focusedAccount != undefined) {
        context = await dashboard_get_context(focusedAccount)
        res.render('dashboard', context)
    } else {
        if (focusedAccount == undefined) {
            focusedAccount = tradeAccounts.personal
        }
        res.redirect("/dashboard?account=" + get_account_name(focusedAccount))
    }
}

const get_stock_history = async(ticker, exchange, range) => {
    var history
    if (exchange === 'CSE') {
        searchQuery = ticker
    } else {
        searchQuery = ticker + ':' + exchange
    }
    console.log(searchQuery)
    await trade.quotes.history(searchQuery, range)
        .then((result) => {
            history = result
        })
        .catch((err) => {
            console.log("This is the error: ", err)
        })
    return history

}

const get_account_history = async(account, range) => {
    var most_recent
    await trade.accounts.history(range, account)
        .then((result) => {
            account_history = result
            most_recent = result.results[result.results.length - 1]
        })
        .catch((err) => {
            console.log(err)
        })

    return { most_recent: most_recent, account_history: account_history }
}

const init_account_chart = async(account_history) => {
    //console.log(account_history.results)
    Chart.register(chartAnnotations)
    var newDataSet = []
    var dateLabels = []
    var maxValue = 0
    account_history.results.forEach(result => {
        dateLabels.push(result.date)
        newDataSet.push({ x: Date.parse(result.date), y: result.value.amount })
        if (result.value.amount > maxValue) {
            maxValue = result.value.amount
        }
    });
    maxValue += maxValue * 0.003
    var config = {
        type: 'line',
        data: {
            labels: dateLabels,
            datasets: [{
                fill: 'origin',
                data: newDataSet,
                tension: 0.3,
                backgroundColor: "#7CB7B6",
                borderColor: '#E5F1F0',
                borderWidth: 1,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            elements: {
                point: {
                    radius: 0
                }
            },
            annotations: {
                line1: {
                    type: 'line',
                    borderColor: '#E5F1F0',
                    borderWidth: 5,
                    borderDash: [5, 10],
                    xScaleID: 'xAxis',
                    yScaleID: 'yAxis',
                    yMax: maxValue,
                    yMin: 0,
                    xMax: newDataSet[0]?.x,
                    xMin: newDataSet[0]?.x,
                    label: {
                        content: [new Date(newDataSet[0]?.x).toString().slice(0, 24), "Portfolio value", ("$ " + (newDataSet[0]?.y?.toFixed(2)?.toString()))],
                        position: 'end',
                        enabled: true,
                        textAlign: 'center',
                        yAdjust: -10

                    }
                },
                point1: {
                    type: 'point',
                    xValue: newDataSet[0]?.x,
                    yValue: maxValue,
                    xScaleID: 'xAxis',
                    yScaleID: 'yAxis',
                    backgroundColor: 'rgba(255,99,132,0.25)',
                    borderColor: "#E5F1F0",
                    borderWidth: 3,
                }

            },
            autocolors: false,
            plugins: {
                legend: { display: false, },
                tooltip: { enabled: false }
            },
            scales: {
                xAxis: {
                    grid: { display: false, drawBorder: false },
                    type: 'timeseries',
                    ticks: { display: false },
                    min: newDataSet[0]?.x,
                    max: newDataSet[newDataSet.length - 1]?.x
                },
                yAxis: {
                    grid: { display: false, drawBorder: false },
                    ticks: { display: false }
                }
            },
            ticks: {
                source: 'auto'
            }
        }

    }

    return config
}

const init_stock_chart = async(stock_history) => {
    //console.log(stock_history)
    Chart.register(chartAnnotations)
    var newDataSet = []
    var dateLabels = []
    var maxValue = 0
    stock_history.results.forEach(result => {
        dateLabels.push(result.date)
        newDataSet.push({ x: Date.parse(result.date + ' ' + result.time), y: parseFloat(result.adjusted_price) })
        if (parseFloat(result.adjusted_price) > maxValue) {
            maxValue = parseFloat(result.adjusted_price)
        }
    });
    maxValue += maxValue * 0.003
    var config = {
        type: 'line',
        data: {
            labels: dateLabels,
            datasets: [{
                fill: 'origin',
                data: newDataSet,
                tension: 0.3,
                backgroundColor: "#7CB7B6",
                borderColor: '#E5F1F0',
                borderWidth: 1,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            elements: {
                point: {
                    radius: 0
                }
            },
            annotations: {
                line1: {
                    type: 'line',
                    borderColor: '#E5F1F0',
                    borderWidth: 5,
                    borderDash: [5, 10],
                    xScaleID: 'xAxis',
                    yScaleID: 'yAxis',
                    yMax: maxValue,
                    yMin: 0,
                    xMax: newDataSet[0].x,
                    xMin: newDataSet[0].x,
                    label: {
                        content: [new Date(newDataSet[0].x).toString().slice(0, 24), "Portfolio value", ("$ " + (newDataSet[0].y.toFixed(2).toString()))],
                        position: 'end',
                        enabled: true,
                        textAlign: 'center',
                        yAdjust: -10

                    }
                },
                point1: {
                    type: 'point',
                    xValue: newDataSet[0].x,
                    yValue: maxValue,
                    xScaleID: 'xAxis',
                    yScaleID: 'yAxis',
                    backgroundColor: 'rgba(255,99,132,0.25)',
                    borderColor: "#E5F1F0",
                    borderWidth: 3,
                }

            },
            autocolors: false,
            plugins: {
                legend: { display: false, },
                tooltip: { enabled: false }
            },
            scales: {
                xAxis: {
                    grid: { display: false, drawBorder: false },
                    type: 'timeseries',
                    ticks: { display: false },
                    min: newDataSet[0].x,
                    max: newDataSet[newDataSet.length - 1].x
                },
                yAxis: {
                    grid: { display: false, drawBorder: false },
                    ticks: { display: false }
                }
            },
            ticks: {
                source: 'auto'
            }
        }

    }

    return config
}


module.exports = {
    dashboard_get,
    update_dash_get,
    stock_page_get,
    update_stock_get,
}