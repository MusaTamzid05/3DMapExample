
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





function degreeToRadian(degree) {
    return degree * Math.PI / 180;
}



function mapInteractions(map, filters) {
    // The devlopment that we're highlighting right now
    var highlightedDevelopmentKey = null;

    // The map's display canvas style properties
    var mapStyle = map.getCanvas().style;

    // How tall our search area for features will be. Currently it's set to the height of the map
    var searchHeight = map.painter.height;

    // Get the wand and hide it for now
    var wand = d3.select(".wand").style("opacity", 0);

    map.on("mousemove", function (e) {
        // Find the development that we're mousing over
        var developmentKey = findBuilding(e.point, searchHeight);

        // If we have a development and it's not the one that's currently highlighted
        if (developmentKey && developmentKey !== highlightedDevelopmentKey) {
            // Save it
            highlightedDevelopmentKey = developmentKey;

            // Get the features around this development
            var features = getFeaturesAroundMouse(e.point, searchHeight, developmentKey);

            // Do something with these features
            highlightOn(features);

            // Place the wand at the center of mass of these features
            var featuresCenter = map.project(turf.centerOfMass(turf.featureCollection(features)).geometry.coordinates)
            wand.style("transform", "translate(-50%, 0px) translate(" + featuresCenter.x + "px," + featuresCenter.y + "px)");

        } else if (highlightedDevelopmentKey && developmentKey === null) {
            // If we have a currently highlighted development and there's none under the cursor, we'll clear it and unhighlight the current one.
            // This means that we're only doing work when the development key has changed, rather than when the mouse has moved.
            highlightedDevelopmentKey = null;
            highlightOff();
        }
    });

    map.on("click", function (e) {
        // Since a click will follow a previous mousemove, we can use the highlighted development key without having to look around again.
        if (highlightedDevelopmentKey) {
            // We get the features around the mouse
            var features = getFeaturesAroundMouse(e.point, searchHeight, highlightedDevelopmentKey);

            // If there are some
            if (features.length) {
                // Place a popup at the center of mass
                popupCoords = turf.centerOfMass(turf.featureCollection(features)).geometry.coordinates;

                app.popup = new mapboxgl.Popup({
                        anchor: "top"
                    })
                    .setLngLat(popupCoords)
                    .setHTML(generatePopupHTML(features[0]))
                    .addTo(map);

                // Get the development status (first feature is fine, since they should all have the same status)
                var status = features[0].properties.status;

                d3.selectAll(".mapboxgl-popup-content")
                    // Set the colour according to the status
                    .style("border-color", getColourForStatus(status))
                    .style("border-width", 6)
                    .style("border-style", "solid")
                    .style("border-radius", "10px");

                d3.selectAll(".mapboxgl-popup-tip")
                    .style("border-bottom-color", getColourForStatus(status));

                // We match the development status to the keys in app.filter, like app.filter.CONSTRUCTED
                function getColourForStatus(status) {
                    return filters[status].colour;
                }

                // Hide the wand when we open a popup.
                d3.select(".wand").text("").style("opacity", 0);

                // Move the map to center the popup. We could also flyTo with a zoom if we wanted a zoom-in effect.
                map.easeTo({
                    center: popupCoords,
                });
            }
        }

    });

    // Generate popup HTML from feature properties
    function generatePopupHTML(feature) {
        var element = document.createElement("div");

        var div = d3.select(element);

        div.append("div")
            .attr("class", "popup-title")
            .text(feature.properties.call_out_line_1a);

        var table = div.append("table")
            .attr("class", "popup-table");

        var status = table.append("tr");
        status.append("th").text("Status");
        status.append("td").text(feature.properties.status);

        var application = table.append("tr");
        application.append("th").text("Town Planning Application");
        application.append("td").text(feature.properties.call_out_line_2a);

        // Check with .toUpperCase() just to be sure we're not checking "na" against "NA"
        if (feature.properties.call_out_line_3a.toUpperCase() !== "NA") {
            var line3 = table.append("tr");
            line3.append("th").text(feature.properties.call_out_line_3a);
            line3.append("td").text(feature.properties.call_out_line_3b);
        }

        if (feature.properties.call_out_line_4a.toUpperCase() != "NA") {
            var line4 = table.append("tr");
            line4.append("th").text(feature.properties.call_out_line_4a);
            line4.append("td").text(feature.properties.call_out_line_4b);
        }

        if (feature.properties.call_out_line_5a.toUpperCase() != "NA") {
            var line5 = table.append("tr");
            line5.append("th").text(feature.properties.call_out_line_5a);
            line5.append("td").text(feature.properties.call_out_line_5b);
        }

        return element.innerHTML;
    }

    // For highlighting features
    function highlightOn(features) {
        // Set the highlight source data to the features we want to highlight
        map.getSource("highlight").setData({
            type: "FeatureCollection",
            features: features,
        });

        // Make it obvious to the user that they can click
        mapStyle.cursor = "pointer";

        // Set the wand to display the address
        d3.select(".wand").text(features[0].properties.call_out_line_1a).style("opacity", 0.9);
    }

    // For unhighlighting features
    function highlightOff() {
        // Set the highlight source data to be empty
        map.getSource("highlight").setData(turf.featureCollection([]));

        // Unset mouse cursor
        mapStyle.cursor = "";

        // Hide the wand
        d3.select(".wand").text("").style("opacity", 0);
    }

    function getFeaturesAroundMouse(point, searchHeight, developmentKey) {
        // Since we're querying for rendered features, we can just state that we want everything that's not constructed.
        // It might be better to invert the filter or explicitly link it to the current filter
        var filter = [
            "all", ["in", "status", "UNDER CONSTRUCTION", "APPROVED", "APPLIED"]
        ];

        // If we supply a developmentKey to this function, we want to look in the same area, but we only want the one development
        if (developmentKey) {
            filter.push(["==", "development_key", developmentKey]);
        }

        // Search around the mouse
        var offsetPointSW = new Array(point.x - 5, searchHeight + 200);
        var offsetPointNE = new Array(point.x + 5, point.y);
        var srchbbox = new Array(offsetPointSW, offsetPointNE);

        // Return an array of features
        return map.queryRenderedFeatures(srchbbox, {
            layers: [buildingsLayerID],
            filter: filter,
        });
    }

    // Find the building that the user is most likely mousing over
    // This algorithm doesn't account for the changes in pitch that occur at the top and bottom of the map,
    // or the non-orthogonal nature of the map. But it sort of works. ¯\_⌒_(ツ)_⌒_/¯
    function findBuilding(point, searchHeight) {
        // Get a bunch of features around the map, without a set developmentKey
        var features = getFeaturesAroundMouse(point, searchHeight);

        // If we can't find anything, oh well
        if (!features.length) return null;

        // For all the developments that we do find, group them under their development_key
        var developments = d3.nest()
            .key(function (d) {
                return d.properties.development_key;
            })
            .entries(features);

        // The most likely candidate that we're looking at
        var mostVisibleFeatureDevelopmentKey = null;

        // A building height to distance from mouse ratio
        var biggestRatio = 0;

        // A GeoJSON point of where the mouse is
        var mousePoint = lngLatToTurfPoint(map.unproject(point));

        // Get the pitch of the map. To make sure we don't divide by 0, clamp it to an epsilon value
        var pitch = degreeToRadian(Math.max(map.getPitch(), 0.1));

        // We're going to look through each group of developments
        developments.forEach(function (development) {
            // Create a featureCollection for this development
            var developmentCollection = turf.featureCollection(development.values);

            // Get the surrounding envelope for this development featureCollection
            var envelope = turf.envelope(developmentCollection);

            // Find the tallest building in this development featureCollection (with some added fudge)
            var tallestExtrusion = d3.max(development.values.map(function (value) {
                // It seems to help to have a min height (for now, 40) and also some extra height on the existing buildings.
                // If you want to tweak the hacky algorithm you can play with these values.
                return Math.max(value.properties.extrusion * 1.05, 40);
            }));

            // Get the center point of the development
            var developmentCentroid = turf.centroid(envelope);

            // Get the distance, in meters, between the mouse and the center of the development
            var distanceBetweenMouseAndTallestDevelopment = turf.distance(developmentCentroid, mousePoint) * 1000;

            // tan(pitch) = height / distance
            // height = distance * tan(pitch)
            var perspectiveHeight = tallestExtrusion * Math.tan(pitch);

            // Get a ratio between to find the tallest-looking structure from the users perspective
            var perspectiveDistance = distanceBetweenMouseAndTallestDevelopment * Math.atan(pitch);
            var ratio = perspectiveDistance / perspectiveHeight;

            // When this ratio is above 1 then the mouse should be above the building
            // If this is the best ratio that we've found, save it
            if (ratio <= 1 && ratio > biggestRatio) {
                biggestRatio = ratio;
                mostVisibleFeatureDevelopmentKey = development.key;
            }
        });

        // Return the most likely development key
        return mostVisibleFeatureDevelopmentKey;
    }
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


// Turf uses GeoJSON point representation, whereas Mapbox uses LngLats
function lngLatToTurfPoint(point) {
    return turf.point([point.lng, point.lat])
}
