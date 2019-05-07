
initApp();

// Creates and returns the map.




// This is another IControl. This one controls the views


// Close the drawer

function openDisclaimer() {
    $("#myModal").modal();
}

// TODO: Tour control
// function TourControl(tour) {
//     this._tour = tour;
// }

// TourControl.prototype.onAdd = function (map) {
//     this._map = map;
//     this._container = document.createElement("div");
//     this._container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";

//     updateTourControlButtons(this._container, map, this._tour);

//     return this._container;
// }

// TourControl.prototype.onRemove = function () {
//     this._container.parentNode.removeChild(this._container);
//     tihs._map = undefined;
// map.addControl(new TourControl(tour), "top-left");
// var viewButtons = d3.selectAll(".view-container").selectAll("div").data(views);
// var tour = false;
// var tourIntervalTime = 2000;
// var tourInterval = null;
// var tourIndex = 0;

// viewButtons.enter().append("div")
//     .style("width", 200)
//     .style("bakcground", "white")
//     .style("color", "black")
//     .text(function (view) {
//         return view.name;
//     })
//     .on("click", function (view) {
//         flyToView(view);
//     });

// var tourButton = d3.select(".tour-start")
//     .on("click", function () {
//         tour = !tour;

//         if (tour) {
//             tourButton.text("Stop tour");
//             tourInterval = setInterval(function () {
//                 tourIndex = tourIndex++ % views.length;
//                 flyToView(views[tourIndex]);
//             }, tourIntervalTime);
//         } else {
//             tourButton.text("Start tour");
//             clearInterval(tourInterval);
//         }
// }






// Turf uses GeoJSON point representation, whereas Mapbox uses LngLats
function lngLatToTurfPoint(point) {
    return turf.point([point.lng, point.lat])
}

function degreeToRadian(degree) {
    return degree * Math.PI / 180;
}


// This makes a geocoder control
function createGeocoder(map) {
    var geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        bbox: [144.89147186279297, -37.86130199456175, 145.01506805419922, -37.779398571318765]
    });

    // When the user selects a geocoder result
    geocoder.on("result", function (e) {
        var steps = 15;
        var units = 'kilometers';

        // NOTE(yuri): Both the base and the height of the "pin" are adjustable.
        // Currently the base is set to 0, but you can play around with it.
        // Note that a height of 20 and a base of 20 will render a flat object
        // as the height is the absolute height, not an offset from the base.
        var centerBase = turf.point(e.result.center, {
            height: 20,
            base: 0,
        });
        var radiusInner = 0.01;

        var centerSpire = turf.point(e.result.center, {
            height: 1000,
            base: 0,
        });
        var radiusOuter = 0.001;

        // Create 2 circles for our pin
        var circleInner = turf.circle(centerBase, radiusInner, steps, units);
        var circleOuter = turf.circle(centerSpire, radiusOuter, steps, units);

        // Add them to the source data that is styled with extrusions
        map.getSource("geocoder").setData(turf.featureCollection([circleInner, circleOuter]));
    });

    // Remove the pin data when the user clears the geocoder
    geocoder.on("clear", function (e) {
        map.getSource("geocoder").setData(turf.featureCollection([]));
    });

    return geocoder;
}


// Object.values polyfill
function ObjectValues(object) {
    return Object.keys(object).map(function (key) {
        return object[key];
    });
}
