
initApp();

// Creates and returns the map.

function replaceHowToText() {

		var newHTML = $("#howto").html().replace(/Click on/g, 'Tap on')

		$("#howto").html(newHTML);

}



// This is how a mapboxgl Control is defined: https://www.mapbox.com/mapbox-gl-js/api/#icontrol

// First we create a constructor function that will add properties this control needs
function LayersControl(filters) {
    this._filters = filters;
}

// An IControl has 2 functions that must be defined: onAdd and onRemove
LayersControl.prototype.onAdd = function (map) {
    // Specify which map this control is being attached to
    this._map = map;

    // Create a container for this control
    this._container = document.createElement('div');

    // Give it some standard mapboxgl classes
    this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';

    // Update the inner workings of this control
    this.update();

    // Always return the container from the onAdd function
    return this._container;
};


LayersControl.prototype.onRemove = function () {
    // Remove this control's container from the parent element
    this._container.parentNode.removeChild(this._container);

    // Unreference the map
    this._map = undefined;
};

// This is a custom function that we define on this control
LayersControl.prototype.update = function () {
    // Save the control as a variable because javascript has weird
    // function-scope stuff which changes the value of "this" in unexpected ways
    var self = this;

    // The following is d3 code for creating elements and keeping them updated according some data.
    // See more here: https://d3js.org/
    // Select our container, and select a button for each filter (these buttons don't exist the first time this function is run)
    var filterButtons = d3.select(self._container).selectAll("button").data(self._filters);

    // For every button that doesn't exist, create one.
    var innerButton = filterButtons.enter().append("button");

    // Merge the list of new buttons with the list of existing buttons
    innerButton.merge(filterButtons)
        // Unconditionally set the class of every button
        .attr("class", "ctrl-button")
        // Conditionally set the background-color of each button according to whether it's enabled or not
        .style("background-color", function (d) {
            return d.enabled ? d.colour : "white"
        })
        // Bind onClick events
        .on("click", function (filter) {
            // Toggle this layer
            filter.enabled = !filter.enabled;
            // If there is a popup, remove it (otherwise a popup might be left on a layer that is no longer displayed)
            if (app.popup) app.popup.remove();
            // Set the new filters with this layer toggled
            setFilter(self._map, self._filters);
            // Run this function again to update the display of these buttons
            self.update();
        });

    // Add a span to hold the icon to each button
    innerButton.append("span")
        // Conditionally set the icon class
        .attr("class", function (filter) {
            return "mapboxgl-ctrl-icon ctrl-icon " + filter.icon;
        });

    // Add a span to hold the text to each button.
    innerButton.append("span")
        .attr("class", "ctrl-icon-text")
        .text(function (filter) {
            return filter.text;
        });
}

// This is another IControl. This one controls the views
function ViewsControl(views, tour) {
    this._views = views;
    this._tour = tour;
}

ViewsControl.prototype.onAdd = function (map) {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';

    this.update();

    return this._container;
};

ViewsControl.prototype.onRemove = function () {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
};

ViewsControl.prototype.update = function () {
    var self = this;
    var viewButtons = d3.select(self._container).selectAll("button").data(self._views);

    var innerButton = viewButtons.enter().append("button");

    innerButton.merge(viewButtons)
        .attr("class", "ctrl-button")
        .on("click", function (view) {
            flyToView(view);
            self.update();
        });

    innerButton.append("span")
        .attr("class", "ctrl-icon-text")
        .text(function (view) {
            return view.name;
        });

    function flyToView(view) {
        self._map.flyTo({
            animate: true,
            duration: 2000,
            zoom: view.zoom,
            pitch: view.pitch,
            bearing: view.bearing,
            center: view.center,
        });
    }
}


// Close the drawer
DrawerControl.prototype.close = function () {
    // If the state isn't closed
    if (this._drawerState !== this._drawerState.CLOSED) {
        // Set it to closed
        this._drawerState = this._drawerStates.CLOSED;
        // If we have a child control
        if (this._childControl) {
            // Remove it from the map
            this._map.removeControl(this._childControl);
            // And remove our reference to it
            this._childControl = null;
        }
    }
}

DrawerControl.prototype.onAdd = function (map) {
    var self = this;
    self._map = map;
    self._container = document.createElement('div');
    self._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';

    // The child control instance
    self._childControl = null;
    // Possible states the drawer can be in
    self._drawerStates = {
        CLOSED: 0,
        GEOCODER: 1,
        VIEWS: 2,
    };
    // Initially it's closed
    self._drawerState = self._drawerStates.CLOSED;

    var div = d3.select(self._container);

    // The geocoder
    var searchButton = div.append("button")
        .attr("class", "ctrl-button")
        .on("click", function () {
            // If the drawer isn't showing the geocoder
            if (self._drawerState !== self._drawerStates.GEOCODER) {
                // Close the drawer (removing any existing controls)
                self.close();

                // Set the drawer state to the geocoder
                self._drawerState = self._drawerStates.GEOCODER;

                // Create the geocoder and add it to the drawer
                self._childControl = createGeocoder(self._map);

                // Add the geocoder to the map
                self._map.addControl(self._childControl, "bottom-right");
            } else {
                // Otherwise if the geocoder was enabled, close the drawer
                self.close();
            }
        });

    searchButton.append("span")
        .attr("class", "mapboxgl-ctrl-icon ctrl-icon glyphicon glyphicon-search");


    // Same as geocoder example above
    var viewsButton = div.append("button")
        .attr("class", "ctrl-button")
        .on("click", function () {
            if (self._drawerState !== self._drawerStates.VIEWS) {
                self.close();
                self._drawerState = self._drawerStates.VIEWS;
                self._childControl = new ViewsControl(self._app.views);
                self._map.addControl(self._childControl, "bottom-right");
            } else {
                self.close();
            }
        });

    viewsButton.append("span")
        .attr("class", "mapboxgl-ctrl-icon ctrl-icon glyphicon glyphicon-eye-open");

    // The disclaimer button doesn't change the state of the drawer, it just opens the disclaimer again.
    var disclaimerButton = div.append("button")
        .attr("class", "ctrl-button")
        .on("click", function () {
            openDisclaimer();
        });

    disclaimerButton.append("span")
        .attr("class", "mapboxgl-ctrl-icon ctrl-icon glyphicon glyphicon-info-sign");

    return this._container;
}


DrawerControl.prototype.onRemove = function () {
    this._map.removeControl(this._childControl);
    this._container.parentNode.removeChild(this._container);

    this._map = undefined;
};

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
