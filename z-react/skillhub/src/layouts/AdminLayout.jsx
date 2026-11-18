import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import "../components/sidebar.css";

function AdminLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  function togglemenu() {
    setOpen(!open);
  }

  const pageHeaders = {
    "/admin/dashboard": {
      title: "Dashboard",
      actions: [
        {
          label: "Invite Users",
          path: "/admin/users",
          className: "invite-btn",
        },
        {
          label: "Create Course",
          path: "/admin/courses?create=true",
          className: "create-btn",
        },
      ],
    },

    "/admin/users": {
      title: "User Management",
      actions: [],
    },

    "/admin/courses": {
      title: "Course Management",
      actions: [],
    },

    "/admin/course-mapping": {
      title: "Course Mapping",
      actions: [],
    },

    "/admin/profile": {
      title: "My Profile",
      actions: [],
    },

    "/admin/settings": {
      title: "Settings",
      actions: [],
    },
  };

  const currentPage = pageHeaders[location.pathname] || {
    title: "SkillHub",
    actions: [],
  };

return (
  <div>
    <Sidebar open={open} togglemenu={togglemenu} />

    <main className={open ? "main-content shifted" : "main-content"}>
      <Header
        title={currentPage.title}
        actions={currentPage.actions}
      />

      <div className="page-content">
        <Outlet />
      </div>
    </main>
  </div>
);
}

export default AdminLayout;