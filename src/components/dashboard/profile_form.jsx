"use client";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { toast } from "sonner";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ToggleableRadio = ({ id, onChange, checked }) => {
  return (
    <div className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-white cursor-pointer"
         onClick={onChange}
         style={{ backgroundColor: checked ? 'white' : 'transparent' }}>
      {checked && <div className="w-2 h-2 rounded-full bg-[#4E54C8]"></div>}
    </div>
  );
};

const FormField = ({ label, name, value, onChange, required = true, placeholder, type = "text", textarea = false, withRadio = false, onRadioToggle, radioChecked, disabled = false }) => {
  return (
    <div className="flex flex-col space-y-2 w-full">
      <div className="flex items-center space-x-2">
        {withRadio && (
          <ToggleableRadio 
            id={`hide-${label.replace(/\s+/g, '-').toLowerCase()}`}
            onChange={onRadioToggle}
            checked={radioChecked}
          />
        )}
        <Label className="text-base font-normal leading-[150%] text-white">
          {label}{required && <span className="text-[#E95050]">*</span>}
        </Label>
      </div>
      
      {textarea ? (
        <Textarea 
          name={name}
          value={value}
          onChange={onChange}
          className="h-[108px] rounded-lg border-[#60A5FA]" 
          placeholder={placeholder}
          disabled={disabled}
        />
      ) : (
        <div className="relative">
          <Input
            name={name}
            value={value}
            onChange={onChange}
            type={type}
            className="h-[42px] rounded-lg border-[#60A5FA]"
            placeholder={placeholder}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
};

const CheckboxGroup = ({ label, name, value, onChange, required = true, options, inline = true }) => {
  return (
    <div className="w-full space-y-4">
      <Label className="text-base font-normal leading-[150%] text-white">
        {label}{required && <span className="text-[#E95050]">*</span>}
      </Label>
      
      <div className={`flex flex-col lg:flex-row ${inline ? "justify-between" : "justify-start gap-8"}`}>
        {options.map((option, index) => (
          <div key={index} className="flex items-center space-x-3 md:space-x-4">
            <Checkbox 
              id={`option-${label}-${index}`} 
              className="w-4 h-4 rounded-[2.29px] border-[1.1px] data-[state=checked]:bg-[#60A5FA] data-[state=checked]:border-white data-[state=unchecked]:bg-transparent"
              checked={value === option}
              onCheckedChange={() => onChange({ target: { name, value: option } })}
            />
            <label 
              htmlFor={`option-${label}-${index}`}
              className="text-sm leading-[150%] font-normal text-white"
            >
              {option}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

const SelectField = ({ label, name, value, onChange, required = true, fullWidth = false, options }) => {
  return (
    <div className={`flex flex-col space-y-2 ${fullWidth ? "w-full" : ""}`}>
      <Label className="text-base font-normal leading-[150%] text-white">
        {label}{required && <span className="text-[#E95050]">*</span>}
      </Label>
      
      <Select value={value} onValueChange={(value) => onChange({ target: { name, value } })}>
        <SelectTrigger className="h-[42px] rounded-lg border-[#60A5FA] [&_svg]:stroke-[#CBD5E1]">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option, index) => (
            <SelectItem key={index} value={option}>{option}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const SchoolInput = ({ value, onChange, onRadioToggle, radioChecked }) => {
  return (
    <div className="flex flex-col space-y-2 w-full">
      <div className="flex items-center space-x-2">
        <ToggleableRadio 
          id="hide-school"
          onChange={onRadioToggle}
          checked={radioChecked}
        />
        <Label className="text-base font-normal leading-[150%] text-white">
          School<span className="text-[#E95050]">*</span>
        </Label>
      </div>
      
      <Input
        name="school"
        value={value}
        onChange={onChange}
        type="text"
        className="h-[42px] rounded-lg border-[#60A5FA]"
        placeholder="Enter your school name"
      />
    </div>
  );
};

const ProfileForm = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "", 
    email: "",
    school: "",
    grade: "",
    subject_proficient: "",
    subject_help: "",
    bio: ""
  });
  
  const [radioStates, setRadioStates] = useState({
    lastName: false,
    email: false,
    school: false
  });

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) throw authError;
        if (!authUser) {
          console.error("User not authenticated");
          return;
        }
        
        setUser(authUser);

        setFormData(prev => ({
          ...prev,
          email: authUser.email
        }));
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') { 
          throw profileError;
        }
    
        if (profileData) {
          setFormData({
            first_name: profileData.first_name || "",
            last_name: profileData.last_name || "",
            email: authUser.email, 
            school: profileData.school || "",
            grade: profileData.grade || "",
            subject_proficient: profileData.subject_proficient || "",
            subject_help: profileData.subject_help || "",
            bio: profileData.bio || ""
          });
          
          setRadioStates({
            lastName: profileData.display_status_lastname === 'off',
            email: profileData.display_status_email === 'off',
            school: profileData.display_status_school === 'off'
          });
        }
      } catch (error) {
        console.error("Error fetching user or profile:", error);
        toast.error("Failed to load your profile information. Please refresh the page.");
      }
    };
    
    fetchUserAndProfile();
  }, []);

  const handleRadioToggle = (field) => {
    setRadioStates(prevState => ({
      ...prevState,
      [field]: !prevState[field]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = ["first_name", "last_name", "school", "grade", "subject_proficient", "subject_help"];
    for (const field of requiredFields) {
      if (!formData[field]) {
        return `Please fill in the ${field.replace('_', ' ')} field`;
      }
    }
    
    if (formData.bio && formData.bio.length > 255) {
      return "Bio must be less than 255 characters";
    }
    
    return null;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to save your profile.");
      return;
    }
    
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    
    setLoading(true);
    
    try {
      const profileData = {
        id: user.id, 
        ...formData,
        display_status_lastname: radioStates.lastName ? 'off' : 'on',
        display_status_email: radioStates.email ? 'off' : 'on',
        display_status_school: radioStates.school ? 'off' : 'on'
      };
    
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      let result;
      
      if (existingProfile) {
        // Update - the RLS policy will check if this is the user's own profile
        result = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id);
      } else {
        // Insert - the RLS policy will check if user.id matches the id field
        result = await supabase
          .from('profiles')
          .insert([profileData]);
      }
      
      if (result.error) throw result.error;
      
      toast.success("Your profile has been saved successfully.");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const gradeOptions = ["9th Grade (freshman)", "10th Grade (sophmore)", "11th Grade (junior)", "12th Grade (senior)", "Other"];
  const subjectOptions = ["AP Physics C", "AP Calculus AB", "AP Calculus BC", "Biology", "Chemistry", "AP Lang", "AP Lit", "AP Computer Science A"];

  return (
    <div className="w-full py-12 px-5 sm:p-16 md:py-20 md:px-50">
      <Card className="w-full shadow-[0px_4px_24px_rgba(155,_138,_255,_0.1)] rounded-[32px] bg-[#0F2A6F] py-10 text-center">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl sm:text-[32px] md:text-[40px] font-bold text-white pb-3 sm:pb-4 font-satoshi">Profile</CardTitle>
          <CardDescription className="text-sm sm:text-[16px] md:text-lg leading-[150%] font-poppins text-white">
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-white mr-2">
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
              <span>Select the radio button (the circle) if you don't want that information to be visible to the public.</span>
            </div>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-left text-base text-white font-body">
          <div className="space-y-10 max-w-[790px] mx-auto">
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField 
                  label="First name" 
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required={true} 
                  placeholder="Enter your first name"
                />
                
                <FormField 
                  label="Last name" 
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required={true} 
                  placeholder="Enter your last name"
                  withRadio={true}
                  radioChecked={radioStates.lastName}
                  onRadioToggle={() => handleRadioToggle("lastName")}
                />
                
                <FormField 
                  label="Email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required={true} 
                  placeholder="Your email address"
                  type="email"
                  withRadio={true}
                  radioChecked={radioStates.email}
                  onRadioToggle={() => handleRadioToggle("email")}
                  disabled={true} 
                />
                
                <SchoolInput 
                  value={formData.school}
                  onChange={handleInputChange}
                  radioChecked={radioStates.school}
                  onRadioToggle={() => handleRadioToggle("school")}
                />
              </div>
            </div>
      
            <CheckboxGroup 
              label="What grade are you in?" 
              name="grade"
              value={formData.grade}
              onChange={handleInputChange}
              required={true} 
              options={gradeOptions} 
            />
            
            <div className="space-y-8">
              <SelectField 
                label="Subject you're awesome at (choose only one)?" 
                name="subject_proficient"
                value={formData.subject_proficient}
                onChange={handleInputChange}
                required={true} 
                fullWidth={true} 
                options={subjectOptions}
              />
              
              <SelectField 
                label="Subject you need help with (choose only one)?" 
                name="subject_help"
                value={formData.subject_help}
                onChange={handleInputChange}
                required={true} 
                fullWidth={true}
                options={subjectOptions}
              />
            </div>
            
            <div className="space-y-8">
              <FormField 
                label="Bio (1-3 lines)" 
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                required={false} 
                textarea={true} 
                placeholder="Tell us a bit about yourself"
              />
            </div>
            
            <div className="relative h-14">
              <Button 
                onClick={handleSubmit}
                disabled={loading || !user}
                className="absolute top-0 left-0 rounded-[38px] bg-[#60A5FA] border-[#FFFFFF] hover:bg-[#3B82F6] border-[1px] w-40 h-14 font-semibold text-white"
              >
                {loading ? "Submitting..." : "Submit"}
              </Button> 
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileForm;