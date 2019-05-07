
function initMap(views) {

    var bounds = [
        [144.88, -37.86], // SW
        [145.01, -37.76], // NE
    ];

    var map = new mapboxgl.Map({
        // style: "mapbox://styles/gisfeedback/ciyt7up4l000p2sqvm9vnrxvw",
        style: "mapbox://styles/gisfeedback/ciyt7up4l000p2sqvm9vnrxvw?update=" + Math.random() * 10000,
        container: "map",
        maxBounds: bounds,
        attributionControl: false,
        minZoom: 14,
        // The first view is displayed by default.
        center: views[0].center,
        zoom: views[0].zoom,
        pitch: views[0].pitch,
        bearing: views[0].bearing,
    });

    return map;
}


function setFilter(map, filters) {
    var baseFilter = ["in", "status"];
    const filter = baseFilter.concat(gatherFilters(filters));
    map.setFilter(buildingsLayerID, filter);
}


// Looks at the app.filters object and gets all the enabled filters
function gatherFilters(filters) {
    return filters.filter(function (filter) {
        return filter.enabled;
    }).map(function (filter) {
        return filter.id;
    });
}
