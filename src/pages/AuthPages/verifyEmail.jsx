import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import authApi from "../../api/AuthApi";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Đang xác thực...");

  useEffect(() => {
    const token = searchParams.get("token");
    const user = searchParams.get("user");
    let timer = null;

    const doRedirectAndClose = (targetPath) => {
      // nếu có tab gốc (opener) thì đổi tab gốc rồi đóng tab verify
      if (window.opener) {
        try {
          window.opener.location.replace(targetPath);
        } catch (e) {
          // một số trình duyệt/điều kiện có thể chặn, fallback bên dưới
        }
        // đóng tab verify sau 3s để user thấy thông báo
        timer = setTimeout(() => {
          window.close();
        }, 3000);
      } else {
        // không có opener → chuyển hướng trong cùng tab
        timer = setTimeout(() => {
          navigate(targetPath, { replace: true });
        }, 3000);
      }
    };

    if (token && user) {
      authApi
        .verifyEmail(token, user)
        .then((res) => {
          if (res?.status === 200) {
            setStatus("User đăng ký thành công — vui lòng quay lại đăng nhập.");
            doRedirectAndClose("/login");
          } else {
            setStatus("Xác thực không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ.");
            doRedirectAndClose("/signup");
          }
        })
        .catch((err) => {
          setStatus(
            err?.response?.data?.message ||
              "Xác thực thất bại. Vui lòng thử lại hoặc liên hệ hỗ trợ."
          );
          doRedirectAndClose("/signup");
        });
    } else {
      setStatus("Link xác thực không hợp lệ.");
      timer = setTimeout(() => navigate("/signup", { replace: true }), 3000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [searchParams, navigate]);

  return (
    <div className="h-screen flex items-center justify-center bg-pink-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-pink-600 mb-4">Xác thực Email</h2>
        <p>{status}</p>
        <p className="mt-3 text-sm text-gray-500">
          (Tab này sẽ tự đóng sau vài giây.)
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
