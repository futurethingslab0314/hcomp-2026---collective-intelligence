# Hide Submission Tabs Design

## Goal

Hide `Doctoral Consortium` and `CrowdCamp` from the Call for Participation submenu while retaining their content, organizers, Notion registry reads, and render branches.

## Design

The desktop tab bar and mobile dropdown both render the same `tabs` array inside `SubmissionSection`. Removing the `dc` and `crowdcamp` objects from that array hides both responsive menu entries without changing either content branch. The `activeTab` union and content-loading code remain unchanged so restoring a tab later only requires adding its menu entry back.

## Testing

A source contract test will scope itself to the `const tabs = [` array and assert that `dc` and `crowdcamp` are absent. It will also confirm their `activeTab` content branches remain in the source, preventing an accidental deletion disguised as menu hiding.
