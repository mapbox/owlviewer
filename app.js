$(function() {
    var map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '<a href="http://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>'
    }).addTo(map);
});
