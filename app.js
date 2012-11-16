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

    // Handle RSS/ATOM feed link updates.
    map.on('moveend', function (e) { updateFeedLink(); updateChangesetList(); });
    map.on('zoomend', function (e) { updateFeedLink(); updateChangesetList(); });

    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    new L.Hash(map);

    // Add summary tiles.
    var markersLayer = L.layerGroup();
    map.addLayer(markersLayer);

    var markers = new L.TileLayer.Marker(
        $.owlviewer.owl_api_url + 'summary/{z}/{x}/{y}'
    );

    map.on('viewreset', function (e) {
        markersLayer.clearLayers();
    });

    markers.on('tileload', function(e) {
        var t = e.tile;
        var icon = L.divIcon({
            html: templates.summarytile(t.data),
            className: 'summary-tile',
            iconSize: [256, 256]
        });
        markersLayer.addLayer(L.marker(t.location, {icon: icon}));
    });
    markers.on('loading', function(e) {
        $('#changesets').html("<div class='loader'><img src='img/spinner.gif' /></div>");
    });
    markers.on('load', function(e) {
        $('#changesets').html("<div class='info'>Zoom in to see<br>changeset details.</div>");
    });

    // Add GeoJSON feature layer

    L.ExtendedGeoJSON = L.GeoJSON.extend({
        addData: function (geojson) {
            var add = true;
            this.eachLayer(function(layer) {
                if (layer.feature.id == geojson.id) {
                  // Already added.
                  add = false;
                  return;
                }
            });
            if (add) {
                L.GeoJSON.prototype.addData.apply(this, arguments);
            }
        }
    });

    var geoJSONStyle = {
        "color": "yellow",
        "fillColor": "yellow",
        "weight": 10,
        "opacity": 0.75,
        "fillOpacity": 0.75
    };
    var geoJSONLayer = new L.ExtendedGeoJSON(null, {
        pointToLayer: function(featureData, latlng) {
            return new L.Circle(latlng, 2);
        },
        onEachFeature: function (feature, layer) {
            var id = '#changeset-' + feature.properties.id;
            layer.setStyle(geoJSONStyle);
            layer.on('mouseover', function() {
                layer.setStyle({
                    "color": "blue",
                    "opacity": 0.05,
                    "fillOpacity": 0.05
                });
                $(id).addClass('highlight');
            });
            layer.on('mouseout', function() {
                layer.setStyle(geoJSONStyle);
                $(id).removeClass('highlight');
            });
        }
    });
    map.addLayer(geoJSONLayer);

    // Add loader for tiled GeoJSON
    var geoJSON = new L.TileLayer.GeoJSON($.owlviewer.owl_api_url + 'changesets/{z}/{x}/{y}');
    geoJSON.on('loading', function(e) {
        $('#changesets').html("<div class='loader'><img src='img/spinner.gif' /></div>");
    });
    geoJSON.on('load', function(e) {
        // Add data to geoJSON layer and populate changeset list
        var data = geoJSON.data();
        geoJSONLayer.addData(data);
        updateChangesetList();
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

    // Updates feed link by generating the URL based on tile range for the currently visible viewport.
    function updateFeedLink() {
        var bounds = map.getPixelBounds(),
          nwTilePoint = new L.Point(
            Math.floor(bounds.min.x / markers.options.tileSize),
            Math.floor(bounds.min.y / markers.options.tileSize)),
          seTilePoint = new L.Point(
            Math.floor(bounds.max.x / markers.options.tileSize),
            Math.floor(bounds.max.y / markers.options.tileSize));

        $('#feed_link').attr('href', $.owlviewer.owl_api_url + 'feed.atom' +
            '?zoom=' + map.getZoom() +
            '&from=' + nwTilePoint.x + '/' + nwTilePoint.y +
            '&to=' + seTilePoint.x + '/' + seTilePoint.y
        );
    }

    function updateChangesetList() {
        if (!geoJSON._map) { return; }
        $('#changesets').empty();
        _(geoJSON.data())
            .chain()
            .reduce(function(m, f) {
                m[f.properties.id] = f.properties;
                return m;
            }, {})
            .sortBy(function(p) {
                return p.id * -1;
            })
            .each(function(p) {
                $('#changesets').append(templates.changeset(p));
            });
        $('.changeset').on('hover', function(e) {
            if (e.target.id.length == 0) {
                // Not a changeset list element!?
                return;
            }
            var changeset_id = e.target.id.split('-')[1];
            // Now highlight all features for that changeset.
            geoJSONLayer.eachLayer(function(layer) {
                  if ((typeof layer.setStyle == 'undefined') || layer.feature.id.indexOf(changeset_id) != 0) {
                      // Not what we're looking for.
                      return;
                  }
                  if (e.type == "mouseenter") {
                      layer.setStyle({
                          "color": "blue",
                          "opacity": 0.05,
                          "fillOpacity": 0.05
                      });
                  } else {
                      layer.setStyle(geoJSONStyle);
                  }
            });
        });
    }
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
