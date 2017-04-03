
    google.maps.event.addDomListener(window, 'load', initMap);

    function initMap() {
        var mapOptions = {
            zoom: 17,
            scrollwheel:  false,
            draggable: false,
            center: new google.maps.LatLng(38.958016,-77.425632),
            styles: [{"featureType":"all","elementType":"all","stylers":[{"visibility":"on"},{"saturation":"-100"},{"lightness":"1"}]},{"featureType":"all","elementType":"labels","stylers":[{"saturation":"1"}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"lightness":"100"},{"gamma":"1.13"},{"saturation":"5"}]},{"featureType":"administrative","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"administrative.country","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"landscape.man_made","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"landscape.natural","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"poi.attraction","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"poi.government","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.medical","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.park","elementType":"all","stylers":[{"visibility":"on"},{"lightness":"24"}]},{"featureType":"poi.place_of_worship","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.school","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.sports_complex","elementType":"all","stylers":[{"visibility":"off"}]}]
        };

        var mapElement = document.getElementById('map');

        var map = new google.maps.Map(mapElement, mapOptions);

        var iconBase = 'uploads/';
        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(38.958016,-77.425632),
            map: map,
            icon: iconBase + 'cf_marker.png'
        });
    }
