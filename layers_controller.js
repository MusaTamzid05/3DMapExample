
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
