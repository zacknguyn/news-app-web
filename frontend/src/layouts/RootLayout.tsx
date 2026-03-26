import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "../components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../components/ui/sidebar";
import { Separator } from "../components/ui/separator";

const RootLayout = () => {
  const location = useLocation();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="w-full flex flex-col overflow-hidden gap-2">
          <section className="mt-2 ml-4 flex items-center">
            <SidebarTrigger className="" />
            <Separator orientation="vertical" className="mx-4" />
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
              {location.pathname === "/" ? "/home" : location.pathname}
            </h4>
          </section>
          <Separator />
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default RootLayout;
