import { SidebarItem } from "@/components/shared/sidebar/sidebar-item";
import { useStore } from "@/store/root.store";
import { RoutesConfigMain } from "@/types/routes/routes";
import { UserRoles } from "@/types/auth";
import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Route } from "@/types/routes/routeKeyPaths";
import { SidebarSubItem } from "@/components/shared/sidebar/sidebar-sub-item";
import { PageContainer } from "@/components/layout/PageContainer";
import { Tabs } from "@/components/ui/Tabs";

const AdminPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<string | null>(null);
    // const adminRoute = getByKey('ADMIN');

    // navigate(`/admin/users`);

    const handleTabChange = (value: string) => {
        navigate(`/admin/${value}`);
        setActiveTab(value);
    }


    return (
        <div className="flex flex-col w-full gap-1 mt-2">
                <Tabs tabs={[
                    { label: "Пользователи", value: "users" },
                    { label: "Настройки", value: "settings" },
                ]} 
                activeTab={activeTab || 0} 
                onChange={(value) => handleTabChange(value as string)} />

            <Outlet />
        </div>
    );
};

export default AdminPage;
