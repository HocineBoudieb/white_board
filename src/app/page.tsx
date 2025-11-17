'use client';

import React, { useState, useRef } from "react";
import Whiteboard from "@/components/Whiteboard";
import { ReactFlowProvider } from "reactflow";

export default function Page() {
  const [title, setTitle] = useState<string>("Titre");
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const whiteboardRef = useRef<any>(null);
  const [groupsOpen, setGroupsOpen] = useState<boolean>(false);

  return (
    <main>
      <div className={`sticky-title-container ${collapsed ? 'collapsed' : ''}`}>
        <button
          className="sticky-title-toggle"
          aria-label={collapsed ? 'Étendre le titre' : 'Rétracter le titre'}
          onClick={() => {
            setCollapsed((v) => {
              const next = !v;
              setGroupsOpen(!next);
              return next;
            });
          }}
        >
          {collapsed ? '▾' : '▴'}
        </button>
        <div
          className="sticky-title"
          contentEditable={!collapsed}
          suppressContentEditableWarning
          onInput={(e) => setTitle((e.target as HTMLElement).innerText)}
          title="Cliquez pour éditer le titre"
        >
          {title}
        </div>
        {groups.length > 0 && groupsOpen && (
          <select
            className="group-select"
            defaultValue=""
            onChange={(e) => {
              const id = e.target.value;
              if (id) {
                whiteboardRef.current?.focusGroup(id);
              }
            }}
            title="Aller au groupe"
          >
            <option value="" disabled>
              Aller au groupe
            </option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        )}
      </div>
      <ReactFlowProvider>
        <Whiteboard ref={whiteboardRef} onGroupsChange={setGroups} />
      </ReactFlowProvider>
    </main>
  );
}