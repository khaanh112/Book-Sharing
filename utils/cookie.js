
const setAccessTokenCookie = (res, token) => {
  res.cookie("accessToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 15 * 60 * 1000 // 15 phút
    });
};

const setRefreshTokenCookie = (res, token) => {
  res.cookie("refreshToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
    });
};

export { setAccessTokenCookie, setRefreshTokenCookie };
