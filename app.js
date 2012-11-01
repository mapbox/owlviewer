$(function() {
    var templates = _($('script[name]')).reduce(function(memo, el) {
        memo[el.getAttribute('name')] = _(el.innerHTML).template();
        return memo;
    }, {});

    var map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '<a href="http://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>'
    }).addTo(map);

    // Location tracking in hash.
    if (location.hash && location.hash.indexOf('#') === 0) {
        var e = location.hash.substring(1).split('/');
        if (e.length == 3) {
            map.setView(
                new L.LatLng(parseFloat(e[0]), parseFloat(e[1])),
                parseFloat(e[2]));
        }
    }
    map.on('moveend', function() {
        var c = map.getCenter();
        location.hash = c.lat + '/' + c.lng + '/' + map.getZoom();
    });

    // Display changesets
    // Example http://localhost:3000/changesets/11/1017/670.geojson?callback=cb
    var geojsonURL = 'http://localhost:3000/changesets/{z}/{x}/{y}.geojson';
    var geojsonLayer = new L.TileLayer.GeoJSON(geojsonURL, {
        tileSize: 256,
        unloadInvisibleTiles: true
    });

    geojsonLayer.setGeoJSONOptions({
        pointToLayer: function(featureData, latlng) {},
        /* style of GeoJSON feature */
        style: {
            "color": "yellow",
            "fillColor": "yellow",
            "weight": 8,
            "opacity": 0.75,
            "fillOpacity": 0.75
        },
        /* style of GeoJSON feature when hovered */
        hoverStyle: {
            "color": "blue",
            "opacity": 0.2,
            "fillOpacity": 0.2
        },
        hoverOffset: new L.Point(30, -16)
    });

    geojsonLayer.on('load', function(e) {
        $('#changesets').empty();
        _(e.target._geoJSONFeatures)
            .chain()
            .reduce(function(m, f) {
                m[f.properties.changeset_id] = f.properties;
                return m;
            }, {})
            .each(function(p) {
                $('#changesets').append(templates.changeset(p));
            });
    });

    geojsonLayer.on('loading', function(e) {
        $('#changesets').html('loading...');
    });

    map.addLayer(geojsonLayer);
});
