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
    <span className="tree-room-name">🚪 {room.RoomName}</span>
    <span className="tree-room-count">{room.AssetCount}</span>
  </div>
);

const SuiteNode: React.FC<{ suite: SuiteNodeDTO }> = ({ suite }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="tree-suite">
      <div className="tree-suite-header" onClick={() => setOpen(o => !o)}>
        <span>{open ? <CaretDownOutlined /> : <CaretLeftOutlined />}</span>
        <span className="tree-suite-name">🏢 {suite.SuiteName}</span>
        <span className="tree-badge">{suite.AssetCount}</span>
      </div>
      {open && (
        <div className="tree-suite-rooms">
          {suite.Rooms.map(r => <RoomNode key={r.RoomId} room={r} />)}
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
        <span className="tree-floor-name">الدور {floor.FloorName}</span>
        <span className="tree-badge">{floor.AssetCount} أصل</span>
      </div>
      {open && (
        <div className="tree-floor-children">
          {floor.Suites.map(s => <SuiteNode key={s.SuiteId} suite={s} />)}
          {floor.Rooms.map(r => <RoomNode key={r.RoomId} room={r} />)}
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
        <div key={b.لآuildingId} className="tree-building">
          <div
            className={`tree-building-header ${selection.buildingId === b.BuildingId && selection.floorId === null ? "selected" : ""}`}
            onClick={() => { toggleBuilding(b.BuildingId); onSelect(b.BuildingId, null); }}
          >
            <BankOutlined className="tree-building-icon" />
            <span className="tree-building-name">{b.BuildingName}</span>
            <div className="tree-building-meta">
              <span className="tree-badge primary">{b.TotalAssets} أصل</span>
              {b.unassignedAssets > 0 && (
                <span className="tree-badge warning">{b.UnassignedAssets} غير مسكّن</span>
              )}
            </div>
            <span className="tree-toggle-icon">
              {openBuildings.has(b.BuildingId) ? <CaretDownOutlined /> : <CaretLeftOutlined />}
            </span>
          </div>
          {openBuildings.has(b.BuildingId) && (
            <div className="tree-building-floors">
              {b?.Floors?.map(f => (
                <FloorNode
                  key={f.FloorId}
                  floor={f}
                  buildingId={b.BuildingId}
                  isSelected={selection.buildingId === b.BuildingId && selection.floorId === f.FloorId}
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