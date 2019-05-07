
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
