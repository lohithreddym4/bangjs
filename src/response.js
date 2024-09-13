function handleResponse(res, statusCode = 200, data = {}, cookies = []) {
  res.statusCode = statusCode;
  cookies.forEach(cookie => {
      res.setHeader('Set-Cookie', `${cookie.name}=${cookie.value}; Path=/; HttpOnly`);
  });
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

module.exports = { handleResponse };
