
function DrawerControl(app) {
    this._app = app;
}

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
};


DrawerControl.prototype.onRemove = function () {
    this._map.removeControl(this._childControl);
    this._container.parentNode.removeChild(this._container);

    this._map = undefined;
};
