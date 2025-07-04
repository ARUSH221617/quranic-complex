"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2Icon,
  Trash2Icon,
  Image as ImageIcon,
  AlertCircle,
  CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  eventFormSchema,
  EventFormValues,
  DetailedEventData,
} from "./schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface EventEditSheetProps {
  isOpen: boolean;
  onOpenChangeAction: (isOpen: boolean) => void;
  onUpdateSuccessAction: () => void;
  eventId: string | null;
}

export function EventEditSheet({
  isOpen,
  onOpenChangeAction,
  onUpdateSuccessAction,
  eventId,
}: EventEditSheetProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      image: "",
      date: new Date(),
      time: "",
      location: "",
      translations: [
        { locale: "en", name: "", description: "" },
        { locale: "ar", name: "", description: "" },
        { locale: "fa", name: "", description: "" },
      ],
    },
  });

  const {
    data: eventItem,
    isLoading,
    isError,
    error,
  } = useQuery<DetailedEventData>({
    queryKey: ["event", eventId],
    queryFn: async () => {
      if (!eventId) {
        throw new Error("Event ID is missing");
      }
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || "Failed to fetch event details");
      }
      return response.json();
    },
    enabled: isOpen && !!eventId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  React.useEffect(() => {
    if (eventItem) {
      setImagePreview(eventItem.image);
      setImageFile(null);

      const locales = ["en", "ar", "fa"];
      const initialTranslations: EventFormValues["translations"] = locales.map(
        (locale) => {
          const existingTranslation = Array.isArray(eventItem.translations)
            ? eventItem.translations.find((t) => t.locale === locale)
            : undefined;

          return {
            locale: locale,
            name: existingTranslation?.name || "",
            description: existingTranslation?.description || "",
          };
        },
      );

      form.reset({
        image: eventItem.image,
        date: new Date(eventItem.date),
        time: eventItem.time,
        location: eventItem.location,
        translations: initialTranslations,
      });
    } else {
      form.reset({
        image: "",
        date: new Date(),
        time: "",
        location: "",
        translations: [
          { locale: "en", name: "", description: "" },
          { locale: "ar", name: "", description: "" },
          { locale: "fa", name: "", description: "" },
        ],
      });
      setImageFile(null);
      setImagePreview(null);
    }
  }, [eventItem, form]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const onSubmit = async (values: EventFormValues) => {
    if (!eventItem) return;

    setIsSubmitting(true);
    toast({
      title: "Updating event item...",
      description: "Please wait while we save your changes.",
    });

    const formData = new FormData();

    formData.append("date", values.date.toISOString());
    formData.append("time", values.time);
    formData.append("location", values.location);
    formData.append("translations", JSON.stringify(values.translations));

    if (imageFile) {
      formData.append("image", imageFile);
    } else if (imagePreview === null) {
      formData.append("image", "");
    }

    try {
      const res = await fetch(`/api/events/${eventItem.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update event item.");
      }

      toast({
        title: "Success",
        description: "Event item updated successfully!",
      });
      onUpdateSuccessAction();
      onOpenChangeAction(false);
    } catch (error) {
      console.error("Failed to update event item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unknown error occurred while updating the event item.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setImageFile(null);
      setImagePreview(null);
    }
    onOpenChangeAction(open);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Event Item</SheetTitle>
          <SheetDescription>
            Make changes to your event item here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="space-y-4 px-4 py-6">
            <Skeleton className="h-32 w-full rounded-md" />
            <Skeleton className="h-10 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-24" />
              <div className="space-y-4 rounded-lg border p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
              <div className="space-y-4 rounded-lg border p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center p-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error instanceof Error
                  ? error.message
                  : "Could not load event data."}
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormItem>
                <FormLabel>Image</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    onChange={handleImageChange}
                    accept="image/*"
                    disabled={isLoading}
                  />
                </FormControl>
                {imagePreview && (
                  <div className="mt-2 relative w-full h-48 border rounded-md overflow-hidden bg-muted flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Image Preview"
                      className="object-contain h-full w-full"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        const input = document.querySelector(
                          'input[type="file"]',
                        ) as HTMLInputElement;
                        if (input) input.value = "";
                      }}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {!imagePreview && (
                  <div className="mt-2 w-full h-48 border rounded-md flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
                <FormMessage />
              </FormItem>

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 10:00 AM"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Main Hall"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <h3 className="text-lg font-semibold mt-6">Translations</h3>
              {form.watch("translations").map((_, index) => (
                <div
                  key={index}
                  className="border p-4 rounded-md space-y-3 relative"
                >
                  <FormField
                    control={form.control}
                    name={`translations.${index}.locale`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Locale</FormLabel>
                        <Select value={field.value} disabled>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a locale" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="ar">Arabic</SelectItem>
                            <SelectItem value="fa">Farsi</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`translations.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Name"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`translations.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Description"
                            {...field}
                            value={field.value || ""}
                            onChange={field.onChange}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Update Event Item"
                )}
              </Button>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}
