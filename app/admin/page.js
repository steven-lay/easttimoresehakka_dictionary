import AdminApp from "./AdminApp";

export const metadata = {
  title: "Admin · East Timorese Hakka-English word list",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return <AdminApp />;
}
