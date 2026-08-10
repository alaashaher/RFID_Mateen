import React, { useState } from "react";
import { BankOutlined, CaretDownOutlined, CaretLeftOutlined } from "@ant-design/icons";
import { BuildingNodeDTO, FloorNodeDTO, SuiteNodeDTO, RoomNodeDTO, SelectionState } from "../types/adminBuildings.types";

interface Props {
  buildings: BuildingNodeDTO[];
  selection: SelectionState;
  onSelect: (buildingId: number, floorId: number | null) => void;
}

const RoomNode: React.FC<{ room: RoomNodeDTO }> = ({ room }) => (
  <div className="tree-room">
    <span className="tree-room-name">🚪 {room.roomName}</span>
    <span className="tree-room-count">{room.assetCount}</span>
  </div>
);

const SuiteNode: React.FC<{ suite: SuiteNodeDTO }> = ({ suite }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="tree-suite">
      <div className="tree-suite-header" onClick={() => setOpen(o => !o)}>
        <span>{open ? <CaretDownOutlined /> : <CaretLeftOutlined />}</span>
        <span className="tree-suite-name">🏢 {suite.suiteName}</span>
        <span className="tree-badge">{suite.assetCount}</span>
      </div>
      {open && (
        <div className="tree-suite-rooms">
          {suite.rooms.map(r => <RoomNode key={r.roomId} room={r} />)}
        </div>
      )}
    </div>
  );
};

const FloorNode: React.FC<{
  floor: FloorNodeDTO;
  buildingId: number;
  isSelected: boolean;
  onSelect: (buildingId: number, floorId: number) => void;
}> = ({ floor, buildingId, isSelected, onSelect }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="tree-floor">
      <div
        className={`tree-floor-header ${isSelected ? "selected" : ""}`}
        onClick={() => { setOpen(o => !o); onSelect(buildingId, floor.floorId); }}
      >
        <span className="tree-toggle">{open ? <CaretDownOutlined /> : <CaretLeftOutlined />}</span>
        <span className="tree-floor-name">الدور {floor.floorName}</span>
        <span className="tree-badge">{floor.assetCount} أصل</span>
      </div>
      {open && (
        <div className="tree-floor-children">
          {floor.suites.map(s => <SuiteNode key={s.suiteId} suite={s} />)}
          {floor.rooms.map(r => <RoomNode key={r.roomId} room={r} />)}
        </div>
      )}
    </div>
  );
};

const BuildingTree: React.FC<Props> = ({ buildings, selection, onSelect }) => {
  const [openBuildings, setOpenBuildings] = useState<Set<number>>(
    new Set(buildings.map(b => b.buildingId))
  );

  const toggleBuilding = (id: number) => {
    setOpenBuildings(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="building-tree">
      <div className="tree-header">
        <span>هيكل المباني</span>
      </div>
      {buildings.map(b => (
        <div key={b.buildingId} className="tree-building">
          <div
            className={`tree-building-header ${selection.buildingId === b.buildingId && selection.floorId === null ? "selected" : ""}`}
            onClick={() => { toggleBuilding(b.buildingId); onSelect(b.buildingId, null); }}
          >
            <BankOutlined className="tree-building-icon" />
            <span className="tree-building-name">{b.buildingName}</span>
            <div className="tree-building-meta">
              <span className="tree-badge primary">{b.totalAssets} أصل</span>
              {b.unassignedAssets > 0 && (
                <span className="tree-badge warning">{b.unassignedAssets} غير مسكّن</span>
              )}
            </div>
            <span className="tree-toggle-icon">
              {openBuildings.has(b.buildingId) ? <CaretDownOutlined /> : <CaretLeftOutlined />}
            </span>
          </div>
          {openBuildings.has(b.buildingId) && (
            <div className="tree-building-floors">
              {b.floors.map(f => (
                <FloorNode
                  key={f.floorId}
                  floor={f}
                  buildingId={b.buildingId}
                  isSelected={selection.buildingId === b.buildingId && selection.floorId === f.floorId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default BuildingTree;