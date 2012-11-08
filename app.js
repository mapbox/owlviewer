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
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    new L.Hash(map);

    // Add summary tiles.
    var markersLayer = L.layerGroup();
    map.addLayer(markersLayer);
    var markers = new L.TileLayer.Marker(
        'http://localhost:3000/summary/{z}/{x}/{y}'
    );
    markers.on('load', function() {
        markersLayer.clearLayers();
        _.each(markers._tiles, function(t) {
            var count = 0;
            if (t.data && t.data.num_changesets) {
                count = t.data.num_changesets;
            }
            var icon = L.divIcon({
                html: '<h3>' + count + '</h3>',
                className: 'summary-tile',
                iconSize: [256, 256]
            });
            markersLayer.addLayer(L.marker(t.location, {icon: icon}));
        });
    });

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
        'http://localhost:3000/changesets/{z}/{x}/{y}', {
          minZoomWithGeometry: 16
        }
    );
    geoJSON.on('loading', function(e) {
        $('#changesets').html("<div class='loader'><img src='img/spinner.gif' /></div>");
    });
    geoJSON.on('load', function(e) {
        // Add data to geoJSON layer and
        // populate changeset list
        var data = geoJSON.data();
        geoJSONLayer.addData(data);
        $('#changesets').empty();
        _(data.features)
            .chain()
            .reduce(function(m, f) {
                m[f.properties.changeset_id] = f.properties;
                return m;
            }, {})
            .sortBy(function(p) {
                return p.changeset_id * -1;
            })
            .each(function(p) {
                $('#changesets').append(templates.changeset(p));
            });
    });

    // Zoom level handling.
    var layerSwitcher = function() {
        if (map.getZoom() > 15) {
            !map.hasLayer(geoJSONLayer) && map.addLayer(geoJSONLayer);
            !map.hasLayer(geoJSON) && map.addLayer(geoJSON);
            map.removeLayer(markers);
            map.removeLayer(markersLayer);
        } else {
            !map.hasLayer(markersLayer) && map.addLayer(markersLayer);
            !map.hasLayer(markers) && map.addLayer(markers);
            map.removeLayer(geoJSON);
            map.removeLayer(geoJSONLayer);
        }
    };
    layerSwitcher();
    map.on('zoomend', layerSwitcher);

    // Active state handling.
    $('.nav-container a').click(function() {
        if ($(this).parent().hasClass('active')) {
            $('.nav-container').removeClass('active');
        } else {
            $('.nav-container').removeClass('active');
            $(this).parent().addClass('active');
        }
    });
    $('.nav-container').mousedown(function(event){
        event.stopPropagation();
    });
    $('html').mousedown(function() {
        $('.nav-container').removeClass('active');
    });
    $('.nav-container').bind( "touchstart", function(event){
        event.stopPropagation();
    });
    $('html').bind( "touchstart", function(e){
        $('.nav-container').removeClass('active');
    });

    // Edit links
    $('.edit-osm').click(function(e) {
        var editor = $(e.currentTarget).attr('editor');
        if (editor == 'remote') {
            var sw = map.getBounds().getSouthWest();
            var ne = map.getBounds().getNorthEast();
            $.ajax({
                url: 'http://127.0.0.1:8111/load_and_zoom' +
                    '?left='   + sw.lng +
                    '&right='  + ne.lng +
                    '&top='    + ne.lat +
                    '&bottom=' + sw.lat +
                    '&new_layer=0',
                complete: function(response) {
                    if (response.status != 200) {
	                    window.alert('Could not connect to JOSM. Is JOSM running? Is Remote Control enabled?');
                    }
                }
            });
        } else {
            var center = map.getCenter();
            var zoom   = map.getZoom();
            window.location =
                'http://www.openstreetmap.org/edit' +
                '?editor=' + editor +
                '&lat='    + center.lat +
                '&lon='    + center.lng +
                '&zoom='   + zoom;
        }
        return false;
    });
});

// Return a formatted date in local time
// 11:36 AM, Oct 20, 2012
Date.prototype.nice = function() {
    var months = {
        0: 'Jan',
        1: 'Feb',
        2: 'Mar',
        3: 'Apr',
        4: 'May',
        5: 'Jun',
        6: 'Jul',
        7: 'Aug',
        8: 'Sep',
        9: 'Oct',
        10: 'Nov',
        11: 'Dec'
    };
    var AMPM = 'AM'
    var hours = this.getHours();
    if (hours > 12) {
        hours = hours - 12;
        hours = hours == 0 ? 12 : hours;
        AMPM = 'PM';
    }
    var o = '';
    o += hours;
    o += ':';
    o += this.getMinutes();
    o += ' ';
    o += AMPM;
    o += ', ';
    o += months[this.getMonth()].toUpperCase();
    o += ' ';
    o += this.getDate();
    o += ' ';
    o += this.getFullYear();
    return o;
};
