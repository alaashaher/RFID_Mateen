import React from "react";
import { HomeOutlined, TagsOutlined } from "@ant-design/icons";
import { BuildingNodeDTO } from "../types/adminBuildings.types";

interface Props {
  building: BuildingNodeDTO | null;
  selectedFloorId: number | null;
}

const FloorCards: React.FC<Props> = ({ building, selectedFloorId }) => {
  if (!building) {
    return (
      <div className="floor-cards-empty">
        <BankIcon />
        <p>اختر مبنى من القائمة اليسرى لعرض تفاصيل أدواره</p>
      </div>
    );
  }

  const floorsToShow = selectedFloorId
    ? building.floors.filter(f => f.floorId === selectedFloorId)
    : building.floors;

  return (
    <div className="floor-cards-section">
      <div className="floor-cards-title">
        <span className="building-label">🏛 {building.buildingName}</span>
        {selectedFloorId && (
          <span className="floor-filter-note">— عرض دور واحد</span>
        )}
      </div>

      <div className="floor-cards-grid">
        {floorsToShow?.map(floor => (
          <div key={floor.floorId} className="floor-card">
            <div className="floor-card-header">
              <span className="floor-card-name">الدور {floor.floorName}</span>
              <div className="floor-card-stats">
                <span><HomeOutlined /> {floor.rooms.length + floor.suites.reduce((acc, s) => acc + s.rooms.length, 0)} غرفة</span>
                <span><TagsOutlined /> {floor.assetCount} أصل</span>
              </div>
            </div>

            {/* Suites */}
            {floor?.suites?.map(suite => (
              <div key={suite.suiteId} className="suite-section">
                <div className="suite-label">🏢 {suite.suiteName}</div>
                <div className="rooms-grid">
                  {suite?.rooms?.map(room => (
                    <div key={room.roomId} className={`room-chip ${room.assetCount === 0 ? "empty" : ""}`}>
                      <span className="room-chip-name">{room.roomName}</span>
                      <span className="room-chip-count">{room.assetCount}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Direct rooms (no suite) */}
            {floor.rooms.length > 0 && (
              <div className="suite-section">
                {floor.suites.length > 0 && <div className="suite-label">غرف مباشرة</div>}
                <div className="rooms-grid">
                  {floor.rooms.map(room => (
                    <div key={room.roomId} className={`room-chip ${room.assetCount === 0 ? "empty" : ""}`}>
                      <span className="room-chip-name">{room.roomName}</span>
                      <span className="room-chip-count">{room.assetCount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {floor.rooms.length === 0 && floor.suites.length === 0 && (
              <div className="floor-card-empty">لا توجد غرف مُضافة</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Fallback icon component
const BankIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b0bec5" strokeWidth="1.5">
    <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
  </svg>
);

export default FloorCards;