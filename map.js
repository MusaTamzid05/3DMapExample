
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


    console.log("Map is initialize.");
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


function addLayers(map, filters) {
    // Create our category color stops
    var stops = [];
    Object.keys(filters).forEach(function (filterName) {
        stops.push([filterName, filters[filterName].colour]);
    });

    // Initialise an empty GeoJSON source that we'll use for highlighting
    map.addSource("highlight", {
        type: "geojson",
        data: turf.featureCollection([])
    });

    // The extrusion highlight layer
    map.addLayer({
        "id": highlightExtrusionLayerID,
        "source": "highlight",
        "type": "fill-extrusion",
        "minzoom": 14,
        "paint": {
            "fill-extrusion-color": {
                "property": "status",
                "type": "categorical",
                "stops": stops,
            },
            "fill-extrusion-height": {
                type: "identity",
                property: "extrusion"
            },
            "fill-extrusion-opacity": 0.9
        }
    }, "place-suburb");

    // The shadow highlight layer
    map.addLayer({
        "id": highlightShadowLayerD,
        "source": "highlight",
        "type": "line",
        "minzoom": 14,
        "paint": {
            "line-color": "#999",
            "line-width": 10,
            "line-opacity": 1,
            "line-blur": 10,
        }
    }, "place-suburb");

    // The actual buildings layer
    map.addLayer({
        "id": buildingsLayerID,
        "source": "composite",
        "source-layer": "CombinedFootprints1605-7bjrex",
        "type": "fill-extrusion",
        "minzoom": 14,
        "paint": {
            "fill-extrusion-color": {
                "property": "status",
                "type": "categorical",
                "stops": stops,
            },
            "fill-extrusion-height": {
                type: "identity",
                property: "extrusion"
            },
            "fill-extrusion-opacity": 0.7
        }
    }, "place-suburb");

    // A GeoJSON source that we'll use for placing the geocoder pin
    map.addSource("geocoder", {
        type: "geojson",
        data: turf.featureCollection([])
    });

    // How the pin will look
    map.addLayer({
        "id": "geocoder",
        "source": "geocoder",
        "minzoom": 14,
        "type": "fill-extrusion",
        "paint": {
            // We'll have to make sure that the pin has a property of height
            "fill-extrusion-height": {
                "property": "height",
                "type": "identity",
            },
            // And base
            "fill-extrusion-base": {
                "property": "base",
                "type": "identity",
            },
            // It's reddish and opaque
            "fill-extrusion-color": "#ea6868",
            "fill-extrusion-opacity": 1.0,
        }
    });
}
