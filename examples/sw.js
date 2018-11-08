/*jshint esversion: 6 */
/*jshint strict:false */
/*global self:true */
/*global caches:true */
/*global Response:true */
/*global Request:true */

(function(){
'use strict';

self.addEventListener('fetch', event => {
    let request = event.request;
    let url = new URL(request.url);

    // Ignore non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    event.respondWith(
        caches.match(request)
            .then(response => {
                // CACHE
                return response || fetch(request);
        })
    );
});
})();
