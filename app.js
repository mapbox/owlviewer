$(function() {
    // Set up templates
    var templates = _($('script[name]')).reduce(function(memo, el) {
        memo[el.getAttribute('name')] = _(el.innerHTML).template();
        return memo;
    }, {});

    // Set up map
    var map = L.map('map', {
        center: [51.505, -0.09],
        zoom: 13,
        minZoom: 2,
        maxBounds: [
            [82, 180],
            [-82, -180]
        ]
    });
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '<a href="http://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>'
    }).addTo(map);

    map.attributionControl.setPrefix('');

    new L.Hash(map);

    // Add GeoJSON feature layer
    var geoJSONLayer = new L.GeoJSON(null, {
        pointToLayer: function(featureData, latlng) {
            return new L.Polyline([latlng]);
        },
        style: {
            "color": "yellow",
            "fillColor": "yellow",
            "weight": 10,
            "opacity": 0.75,
            "fillOpacity": 0.75
        },
        onEachFeature: function (feature, layer) {
            var style = this.style;
            var id = '#changeset-' + feature.properties.changeset_id;
            layer.on('mouseover', function() {
                layer.setStyle({
                    "color": "blue",
                    "opacity": 0.2,
                    "fillOpacity": 0.2
                });
                $(id).addClass('highlight');
            });
            layer.on('mouseout', function() {
                layer.setStyle(style);
                $(id).removeClass('highlight');
            });
        }
    });
    map.addLayer(geoJSONLayer);

    // Add loader for tiled GeoJSON
    var geoJSON = new L.TileLayer.GeoJSON(
        'http://localhost:3000/changesets/{z}/{x}/{y}.geojson'
    );
    geoJSON.on('loading', function(e) {
        $('#changesets').html("<div class='loader'><img src='img/spinner.gif' /></div>");
    });
    geoJSON.on('load', function(e) {

        // Add data to geoJSON layer
        geoJSONLayer.addData(geoJSON.data);

        // Popuplate changeset list
        $('#changesets').empty();
        _(geoJSON.data.features)
            .chain()
            .reduce(function(m, f) {
                m[f.properties.changeset_id] = f.properties;
                return m;
            }, {})
            .each(function(p) {
                $('#changesets').append(templates.changeset(p));
            });
    });
    map.addLayer(geoJSON);

        // Non-map
        $('.nav-container a').click(function() {
            $(this).parent().toggleClass('active');
        });

});
