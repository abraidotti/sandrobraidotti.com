// CloudFront Function (cloudfront-js-2.0), viewer request, attached to distribution E2OFL6K1HFCZ4V
// as "sandrobraidotti-rewrite". The S3 REST origin doesn't resolve directory indexes, so map
// /blog/ -> /blog/index.html and redirect extensionless paths (/blog) to their slash form.
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
    return request;
  }

  var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
  if (lastSegment.indexOf('.') === -1) {
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { location: { value: uri + '/' } },
    };
  }

  return request;
}
