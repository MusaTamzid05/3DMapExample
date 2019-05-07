
// This contains the application state.
var app = {
    // When we have a popup, we'll store it here so that we can remove it
    popup: null,

    // Our map
    map: null,

    // Our filters
    // They have keys so we can refer to them like app.filters.CONSTRUCTED
    filters: {
        "CONSTRUCTED": {
            // The ID of the filter. We can probably just use the key above but some code expects an array of filters for now.
            id: "CONSTRUCTED",

            // The displayed name
            text: "Constructed",

            // Background colour
            colour: "#dee1e8",

            // Icon classes
            icon: "glyphicon glyphicon-time",

            // Whether it's enabled initially (and used later for programmatic enabling/disabling)
            enabled: true,
        },
        "UNDER CONSTRUCTION": {
            id: "UNDER CONSTRUCTION",
            text: "Under Construction",
            colour: "#ffe613",
            icon: "glyphicon glyphicon-exclamation-sign",
            enabled: true,
        },
        "APPROVED": {
            id: "APPROVED",
            text: "Approved",
            colour: "#00ff00",
            icon: "glyphicon glyphicon-ok",
            enabled: true,
        },
        "APPLIED": {
            id: "APPLIED",
            text: "Applied",
            colour: "#00e4ff",
            icon: "glyphicon glyphicon-th-list",
            enabled: true,
        }
    },

    // Information needed for cycling between views.
    tour: {
        touring: false,
        viewIndex: 0,
        stopDuration: 5000,
    },

    // The views. Each one needs all the properties filled out.
    views: [{
            name: "Home view",
            zoom: 15,
            pitch: 60,
            bearing: -17.6,
            center: [144.960712, -37.8190000],
        },
        {
            name: "Bird's-eye",
            zoom: 15,
            pitch: 0,
            bearing: 2,
            center: [144.960712, -37.8190000],
        },
        {
            name: "Western view",
            zoom: 15,
            pitch: 60,
            bearing: 70,
            center: [144.960712, -37.8190000],
        },
        {
            name: "Eastern view",
            zoom: 15,
            pitch: 60,
            bearing: 290,
            center: [144.960712, -37.8190000],
        },
        {
            name: "Northern view",
            zoom: 15,
            pitch: 60,
            bearing: 180,
            center: [144.960712, -37.8190000],
        },
    ]
};

function initApp() {

        // Create our map
    app.map = initMap(app.views);

    // Once it's loaded...
    app.map.on("load", function () {
        // Hide the spinner
        $("#loader").hide();

        if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
            replaceHowToText();
        }

        // Add the navigation controls
        app.map.addControl(new mapboxgl.NavigationControl(), "top-right");

        // Enable keyboard navigation
        app.map.keyboard.enable();

        // Add layer controls
        app.map.addControl(new LayersControl(ObjectValues(app.filters)), "top-left");

        // Add the actual layers to the map
        addLayers(app.map, app.filters);

        // Filter the layers (layers need to be added first to filter on them)
        setFilter(app.map, ObjectValues(app.filters));

        // Enable map interactions like hover/click
        mapInteractions(app.map, app.filters);

        // Add a drawer control that will hold other controls
        app.map.addControl(new DrawerControl(app), "bottom-right");

        // Open the disclaimer. Comment this out when developing so that it's not annoying
        openDisclaimer();
        console.log("App initialize");
    });
}
