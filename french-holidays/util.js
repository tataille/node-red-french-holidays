/* 
    Useful methods
*/

// Display error in NodeRed
function displayErrorMsg(msg) {
    node.status({ fill: "red", shape: "ring", text: msg });
    throw new Error(msg);
}

function getDayDifference(day, target) {
    let start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    let end = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    let timeDifference = end - start;
    return Math.round(timeDifference / (1000 * 3600 * 24));
}

// Define if it is a part of period
function isInPeriod(day, start_date, end_date) {
    const _daysDifferenceStart = getDayDifference(day, start_date)
    const _daysDifferenceEnd = getDayDifference(day, end_date)
    return _daysDifferenceStart <= 0 && _daysDifferenceEnd >= 0
}

// Sort Dates
function sortDates(obj) {
    return Object.keys(obj)
        .sort()
        .reduce((res, key) => ((res[key] = obj[key]), res), {})
}

module.exports = {
    isInPeriod: isInPeriod,
    getDayDifference: getDayDifference,
    displayErrorMsg: displayErrorMsg,
    sortDates: sortDates
}