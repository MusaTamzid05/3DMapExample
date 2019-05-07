
initApp();

function ObjectValues(object) {
    return Object.keys(object).map(function (key) {
        return object[key];
    });
}
