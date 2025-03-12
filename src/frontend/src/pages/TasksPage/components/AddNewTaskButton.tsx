import ForwardedIconComponent from "@/components/common/genericIconComponent";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useGetActors } from "@/controllers/API/queries/actors";
import { usePostTask } from "@/controllers/API/queries/tasks/use-post-task";
import BaseModal from "@/modals/baseModal";
import useAlertStore from "@/stores/alertStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Form validation schema
const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  attachments: z.array(z.string()),
  author_id: z.string().uuid("Invalid author ID"),
  assignee_id: z.string().uuid("Invalid assignee ID"),
  category: z.string().min(1, "Category is required"),
  state: z.string().min(1, "State is required"),
  status: z.enum(["pending", "processing", "completed", "failed"]),
});

type TaskFormValues = z.infer<typeof taskSchema>;

export default function AddNewTaskButton({
  children,
  asChild,
}: {
  children: JSX.Element;
  asChild?: boolean;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [attachmentInput, setAttachmentInput] = useState("");
  const setErrorData = useAlertStore((state) => state.setErrorData);
  const setSuccessData = useAlertStore((state) => state.setSuccessData);
  const { mutate: mutateAddTask, isPending } = usePostTask();

  // Fetch actors for the current project
  const { data: actors, isLoading: actorsLoading } = useGetActors({});

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      attachments: [],
      author_id: "",
      assignee_id: "",
      category: "",
      state: "",
      status: "pending",
    },
  });

  function handleAddAttachment(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && attachmentInput.trim()) {
      e.preventDefault();
      const currentAttachments = form.getValues("attachments");
      form.setValue("attachments", [
        ...currentAttachments,
        attachmentInput.trim(),
      ]);
      setAttachmentInput("");
    }
  }

  function handleRemoveAttachment(index: number) {
    const currentAttachments = form.getValues("attachments");
    form.setValue(
      "attachments",
      currentAttachments.filter((_, i) => i !== index),
    );
  }

  function onSubmit(data: TaskFormValues) {
    mutateAddTask(data, {
      onSuccess: (res) => {
        setSuccessData({
          title: `Task "${res.title}" created successfully`,
        });
        setOpen(false);
        form.reset();
      },
      onError: (error: any) => {
        setErrorData({
          title: "Error creating task",
          list: [
            error?.response?.data?.detail ||
              "An unexpected error occurred while adding a new task. Please try again.",
          ],
        });
      },
    });
  }

  return (
    <BaseModal open={open} setOpen={setOpen} size="medium">
      <BaseModal.Header description="Create a new task to manage your workflow">
        <span className="pr-2">Create Task</span>
        <ForwardedIconComponent
          name="SquareCheckBig"
          className="h-6 w-6 pl-1 text-primary"
          aria-hidden="true"
        />
      </BaseModal.Header>
      <BaseModal.Trigger asChild={asChild}>{children}</BaseModal.Trigger>
      <BaseModal.Content className="max-h-[80vh] overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="mb-4 text-sm font-medium">Task Details</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter task title..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter task description..."
                            className="h-24 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="attachments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Attachments</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              value={attachmentInput}
                              onChange={(e) =>
                                setAttachmentInput(e.target.value)
                              }
                              onKeyDown={handleAddAttachment}
                              placeholder="Type and press Enter to add attachments..."
                            />
                            <div className="flex flex-wrap gap-2">
                              {field.value.map((attachment, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="flex items-center gap-1"
                                >
                                  {attachment}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveAttachment(index)
                                    }
                                    className="ml-1 rounded-full p-1 hover:bg-background/80"
                                  >
                                    <ForwardedIconComponent
                                      name="X"
                                      className="h-3 w-3"
                                    />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-4 text-sm font-medium">
                  Assignment & Status
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="author_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Author</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select author" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {actorsLoading ? (
                              <SelectItem value="loading" disabled>
                                Loading actors...
                              </SelectItem>
                            ) : actors && actors.length > 0 ? (
                              actors.map((actor) => (
                                <SelectItem key={actor.id} value={actor.id}>
                                  <div className="flex items-center gap-2">
                                    <ForwardedIconComponent
                                      name={
                                        actor.entity_type === "user"
                                          ? "User"
                                          : "Workflow"
                                      }
                                      className="h-4 w-4 text-muted-foreground"
                                    />
                                    {actor.name ||
                                      (actor.entity_type === "user"
                                        ? "User"
                                        : "Flow")}
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                No actors available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assignee_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assignee</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select assignee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {actorsLoading ? (
                              <SelectItem value="loading" disabled>
                                Loading actors...
                              </SelectItem>
                            ) : actors && actors.length > 0 ? (
                              actors.map((actor) => (
                                <SelectItem key={actor.id} value={actor.id}>
                                  <div className="flex items-center gap-2">
                                    <ForwardedIconComponent
                                      name={
                                        actor.entity_type === "user"
                                          ? "User"
                                          : "Workflow"
                                      }
                                      className="h-4 w-4 text-muted-foreground"
                                    />
                                    {actor.name ||
                                      (actor.entity_type === "user"
                                        ? "User"
                                        : "Flow")}
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                No actors available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter category..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter state..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">
                              Processing
                            </SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </form>
        </Form>
      </BaseModal.Content>
      <BaseModal.Footer
        submit={{
          label: "Create Task",
          dataTestId: "save-task-btn",
          onClick: form.handleSubmit(onSubmit),
          loading: isPending,
        }}
      />
    </BaseModal>
  );
}
