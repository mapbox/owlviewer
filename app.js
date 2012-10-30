$(function() {
    var map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '<a href="http://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>'
    }).addTo(map);
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
});
