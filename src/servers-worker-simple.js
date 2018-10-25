// test name. Used to set a cookie to a value of 'a' or 'b'
const name = 'simpleswap';
// text group a will get
const aText = 'donuts';
// text group b should get instead
const bText = 'stroop wafels';
// url where this should apply
const url = "https://master-origin-servers-workers.fgview.com/simple.html";


// don't edit below here
addEventListener("fetch", event => {
	if( event.request.url.indexOf(url) > -1 ){
		event.respondWith(fetchAndModify(event.request));
	}
});

async function fetchAndModify(request) {
	// 'a' or 'b', set below
	let group;

	// Send the request on to the origin server.
	const response = await fetch(request);

	// Determine which group this request is in.
	const cookie = request.headers.get('Cookie');

	// Get headers into a var to possibly change.
	const conditionalHeaders = new Headers(response.headers);

	// Read response body.
	const text = await response.text();

	if (cookie && cookie.includes(`${name}=a`)) {
		group = 'a';
	} else if (cookie && cookie.includes(`${name}=b`)) {
		group = 'b';
	} else {
		// 50/50 Split
		group = Math.random() < 0.5 ? 'a' : 'b';
		// The experiment was newly-assigned, so add a Set-Cookie header
		// to the response.
		conditionalHeaders.append('Set-Cookie', `${name}=${group}`);
	}

	// Get response into a var to possibly change.
	let conditionalResponse = text;

	// b group gets transformed response
	if (group === 'b') {
		conditionalResponse = text.replace( aText, bText );
	}

	return new Response(conditionalResponse, {
		status: response.status,
		statusText: response.statusText,
		headers: conditionalHeaders
	});
}
