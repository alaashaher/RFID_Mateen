import { DatabaseOutlined, HomeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import RouterLinks from "../../App/RouterLinks";
// import { Building2, ClipboardList, ArrowUpRight } from "lucide-react";
// import styles from "./NavButtons.module.scss";

const actions = [
    {
        label: "مباني الادارة",
        caption: "",
        path: RouterLinks.AdminBuildings,
        Icon: <HomeOutlined />,
        accent: "#C87D4B", // warm copper
        variant: "buildings",
    },
    {
        label: "تقارير المخزون والاصول",
        caption: "",
        path: RouterLinks.InventoryReport,
        Icon: <DatabaseOutlined />,
        accent: "#4B7B96", // steel blue
        variant: "inventory",

    },
];

export default function MultiDashBoard() {
    const navigate = useNavigate();

    return (
        <div className={"wrapper"}>
            {actions.map(({ label, caption, path, Icon, variant }) => (
                <button
                    key={path}
                    type="button"
                    onClick={() => navigate(path)}
                    className={`card ${variant}`}
                >
                    <span className={"iconWrap"}>
                        {Icon}
                    </span>

                    <span className={"textGroup"}>
                        <span className={"label"}>{label}</span>
                        <span className={"caption"}>{caption}</span>
                    </span>

                    <span className={"arrow"}>
                    </span>

                    <span className={"underline"} />
                </button>
            ))}
        </div>

    );
}