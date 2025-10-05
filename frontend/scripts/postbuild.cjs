const fs = require('fs');
const path = require('path');

const distIndex = path.join(__dirname, '..', 'dist', 'index.html');
let content = fs.readFileSync(distIndex, 'utf8');

// Remove any link tags that reference manifest.webmanifest or /manifest.webmanifest
content = content.replace(/<link[^>]+rel="manifest"[^>]*>/gi, '');

fs.writeFileSync(distIndex, content, 'utf8');
console.log('postbuild: removed manifest link(s) from dist/index.html');

// Embed PinStats.png as data URI to avoid external fetches (Cloudflare may block static assets)
try {
	const publicIconPath = path.join(__dirname, '..', 'public', 'PinStats.png');
	if (fs.existsSync(publicIconPath)) {
		const iconData = fs.readFileSync(publicIconPath);
		const base64 = iconData.toString('base64');
		const dataUri = `data:image/png;base64,${base64}`;

		let updated = fs.readFileSync(distIndex, 'utf8');
		// Replace occurrences of /PinStats.png in the runtime manifest and apple-touch-icon links
		updated = updated.replace(/\/PinStats.png/g, dataUri);

		fs.writeFileSync(distIndex, updated, 'utf8');
		console.log('postbuild: embedded PinStats.png as data URI into dist/index.html');
	} else {
		console.warn('postbuild: public/PinStats.png not found, skipping embedding');
	}
} catch (e) {
	console.error('postbuild: error embedding icon', e);
}