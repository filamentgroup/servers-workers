
// This worker requires no JS configuration
// It can run on any HTML page with comments surrounding named AB tests.
// sample html for a and b tags:
//<!--workertest:myTestName=a--><h2>A Content Here</h2><!--/workertest:myTestName=a--><!--workertest:myTestName=b--><h2>B Content Here</h2><!--/workertest:myTestName=b-->


// don't edit below here
const commentOpen = '\<\!\-\-';
const commentClose = '\-\-\>';

function comment(name, group, close){
	return commentOpen + ( close ? '/' : '' ) + name + '=' + group + commentClose;
}

function closeCommentRegExp(name, group, close){
	// NOTE use the close comment since we don't match over content with the open
	return new RegExp(comment(name, group, true), 'g');
}

function getPattern(name, group ){
	let startComment = comment(name, group, false);
	let endComment = comment(name, group, true);
	return new RegExp( startComment + "[^]+" + endComment );
}

function isDuped(text, name, group) {
	return (text.match(closeCommentRegExp(name, group)) || []).length > 1;
}

addEventListener("fetch", event => event.respondWith(fetchAndModify(event.request)));

async function fetchAndModify(request) {
	// Send the request on to the origin server, minify html response
	const response = await fetch(request, { cf: { minify: { html: true } } });

	// check the content type, we only want html
	const content = response.headers.get("Content-Type");
	if( !content || content.indexOf("text/html") == -1 ){
		return response;
	}

	// Determine which group this request is in.
	const cookie = request.headers.get('Cookie');

	// Get headers into a var to possibly change.
	const conditionalHeaders = new Headers(response.headers);

	// Read response body.
	let text = await response.text();

	// Find workertest:foo strings in markup to use for lookups
	let testnames = text.match( /(workertest:[^=]+)/g ) || [];

	// reduce to unique array
	let uniquetests = testnames.reduce(function(a, b) {
		if (a.indexOf(b) < 0){
			a.push(b);
		}
		return a;
	}, []);

	uniquetests.forEach(function(name, i){
		// 'a' or 'b', set below
		let group;
console.log(cookie);
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

		if( isDuped(text, name, group) ) {
			console.error("There is a duplicate test in the page!");
			return;
		}

		const groupapattern = getPattern( name, "a" );
		const groupbpattern = getPattern( name, "b" );

		// transform response to exclude html for inactive group
		if (group === 'a') {
			text = text.replace( groupbpattern, '' );
		} else {
			text = text.replace( groupapattern, '' );
		}
	});

	return new Response(text, {
		status: response.status,
		statusText: response.statusText,
		headers: conditionalHeaders
	});
}
