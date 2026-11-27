"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function TableWithDialog({ data }: { data: any[] }) {
  const [selectedUser, setSelectedUser] = useState<any>(null);

  return (
    <div className="bg-background border rounded-lg shadow-md">
      <div className="max-h-[600px] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
            <TableRow>
              <TableHead><Checkbox /></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell><Checkbox /></TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>
                  <Badge variant={item.status === "Active" ? "default" : "secondary"}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => setSelectedUser(item)}>View</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Details</DialogTitle>
                        <DialogDescription>{item.name}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        <p><strong>Email:</strong> {item.email}</p>
                        <p><strong>Status:</strong> {item.status}</p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="sticky bottom-0 bg-background z-10">
            <TableRow>
              <TableCell colSpan={5}>Total: {data.length}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
